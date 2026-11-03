import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

function returnDeadline17Wib(endDate: Date): Date {
  // Rental date-only values are stored at UTC midnight; 17:00 WIB is 10:00 UTC.
  return new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 10));
}

function validActualDate(value: unknown, now: Date): Date | null {
  if (value === undefined || value === null || value === "") return now;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || parsed > now ? null : parsed;
}

export async function POST(req: Request, context: RouteContext) {
  const { user, response } = await requireSessionUser("admin");
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Data pengembalian tidak valid." }, { status: 400 }); }

  const finalConditionNotes = typeof body.finalConditionNotes === "string" ? body.finalConditionNotes.trim() : "";
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";
  const damageFee = body.damageFee === undefined || body.damageFee === null || body.damageFee === "" ? 0 : Number(body.damageFee);
  const now = new Date();
  const actualReturnDate = validActualDate(body.actualReturnDateStr, now);
  if (finalConditionNotes.length < 2 || finalConditionNotes.length > 2000 || adminNotes.length > 2000 || !Number.isSafeInteger(damageFee) || damageFee < 0 || !actualReturnDate) {
    return NextResponse.json({ error: "Catatan kondisi, tanggal pengembalian, atau biaya kerusakan tidak valid." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM Rental WHERE id = ${id} FOR UPDATE`;
      const rental = await tx.rental.findUnique({ where: { id }, include: { unit: { include: { equipment: true } }, returnRecord: true } });
      if (!rental) return { kind: "missing" as const };
      if (rental.rentalStatus !== "sedang_disewa" || rental.exceptionStatus) return { kind: "wrong_status" as const };
      if (rental.returnRecord) return { kind: "duplicate" as const };
      if (!rental.unitId || !rental.unit) return { kind: "unit_missing" as const };

      const deadline = returnDeadline17Wib(rental.endDate);
      const lateDays = actualReturnDate > deadline ? Math.ceil((actualReturnDate.getTime() - deadline.getTime()) / 86_400_000) : 0;
      const lateFee = lateDays * rental.dailyRate;
      const totalFine = lateFee + damageFee;
      if (!Number.isSafeInteger(lateFee) || !Number.isSafeInteger(totalFine)) return { kind: "amount_overflow" as const };
      const returnRecord = await tx.returnRecord.create({ data: {
        rentalId: id, actualReturnDate, lateDays, lateFee, damageFee, totalFine,
        finePaymentStatus: totalFine > 0 ? "belum_dibayar" : "lunas",
        initialConditionNotes: "Kondisi awal tercatat", finalConditionNotes, adminNotes: adminNotes || null,
      } });
      const nextStatus = totalFine > 0 ? "pemeriksaan_pengembalian" : "selesai";
      await tx.rental.update({ where: { id }, data: { rentalStatus: nextStatus } });
      await tx.rentalStatusHistory.create({ data: { rentalId: id, actorId: user.id, fromStatus: "sedang_disewa", toStatus: nextStatus, reason: totalFine > 0 ? `Pengembalian diperiksa; denda Rp${totalFine} menunggu pelunasan.` : "Alat dikembalikan tepat waktu/tanpa denda dan pemeriksaan selesai." } });
      if (damageFee > 0) await tx.equipmentUnit.update({ where: { id: rental.unitId }, data: { conditionStatus: "perawatan", notes: finalConditionNotes } });
      return { kind: "ok" as const, returnRecord, rental: { ...rental, rentalStatus: nextStatus } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });

    if (result.kind === "missing") return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (result.kind === "wrong_status") return NextResponse.json({ error: "Pengembalian hanya dapat dicatat untuk pesanan berstatus Sedang Disewa." }, { status: 409 });
    if (result.kind === "duplicate") return NextResponse.json({ error: "Pengembalian untuk pesanan ini sudah dicatat." }, { status: 409 });
    if (result.kind === "unit_missing") return NextResponse.json({ error: "Unit fisik pada pesanan tidak tersedia." }, { status: 409 });
    if (result.kind === "amount_overflow") return NextResponse.json({ error: "Nominal denda melebihi batas yang didukung." }, { status: 400 });
    return NextResponse.json({ message: result.returnRecord.totalFine > 0 ? "Pemeriksaan selesai. Terdapat denda yang harus dilunasi." : "Pengembalian berhasil dan transaksi selesai.", returnRecord: result.returnRecord, rental: result.rental });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Pengembalian untuk pesanan ini sudah dicatat." }, { status: 409 });
    console.error("Return processing failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses pengembalian alat." }, { status: 500 });
  }
}

export async function PUT(_req: Request, context: RouteContext) {
  const { user, response } = await requireSessionUser("admin");
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM Rental WHERE id = ${id} FOR UPDATE`;
      const rental = await tx.rental.findUnique({ where: { id }, include: { returnRecord: true } });
      if (!rental) return { kind: "missing" as const };
      if (rental.rentalStatus !== "pemeriksaan_pengembalian" || !rental.returnRecord || rental.returnRecord.finePaymentStatus === "lunas" || rental.returnRecord.totalFine <= 0) return { kind: "invalid" as const };
      const record = await tx.returnRecord.update({ where: { rentalId: id }, data: { finePaymentStatus: "lunas" } });
      const updatedRental = await tx.rental.update({ where: { id }, data: { rentalStatus: "selesai" } });
      await tx.rentalStatusHistory.create({ data: { rentalId: id, actorId: user.id, fromStatus: "pemeriksaan_pengembalian", toStatus: "selesai", reason: "Denda pengembalian telah dilunasi." } });
      return { kind: "ok" as const, record, rental: updatedRental };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });
    if (result.kind === "missing") return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (result.kind === "invalid") return NextResponse.json({ error: "Tidak ada denda yang menunggu pelunasan untuk pesanan ini." }, { status: 409 });
    return NextResponse.json({ message: "Denda berhasil dilunasi dan transaksi selesai.", returnRecord: result.record, rental: result.rental });
  } catch (error) {
    console.error("Fine settlement failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses pelunasan denda." }, { status: 500 });
  }
}
