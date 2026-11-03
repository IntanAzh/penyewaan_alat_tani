import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await requireSessionUser("admin");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const body = await req.json();
    const action = body.action;
    const rejectReason = typeof body.rejectReason === "string" ? body.rejectReason.trim().slice(0, 500) : "";
    if (action !== "approve" && action !== "reject") return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
    if (action === "reject" && !rejectReason) return NextResponse.json({ error: "Alasan penolakan wajib diisi." }, { status: 400 });
    if (action === "reject" && typeof body.rejectReason === "string" && body.rejectReason.trim().length > 500) return NextResponse.json({ error: "Alasan penolakan maksimal 500 karakter." }, { status: 400 });

    const rental = await prisma.rental.findUnique({ where: { id: params.id }, select: { id: true, rentalStatus: true, unitId: true, startDate: true, endDate: true } });
    if (!rental) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_persetujuan") return NextResponse.json({ error: "Pesanan sudah diproses." }, { status: 409 });

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "approve") {
        // Recheck the assigned physical unit while holding its row lock before Admin approval.
        const unitRows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM EquipmentUnit WHERE id = ${rental.unitId} FOR UPDATE`;
        const unit = unitRows[0] ? await tx.equipmentUnit.findUnique({ where: { id: unitRows[0].id }, select: { conditionStatus: true } }) : null;
        if (!unit || unit.conditionStatus !== "aktif") return { conflict: "Unit tidak lagi layak disewakan. Periksa kondisi unit sebelum menyetujui pesanan." } as const;
        const overlapping = await tx.rental.findFirst({
          where: {
            id: { not: params.id }, unitId: rental.unitId,
            rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] }, exceptionStatus: null,
            OR: [
              { startDate: { lte: rental.endDate }, endDate: { gte: rental.startDate } },
              { rentalStatus: { in: ["sedang_disewa", "pemeriksaan_pengembalian"] } },
            ],
          }, select: { id: true },
        });
        if (overlapping) return { conflict: "Jadwal unit sudah berbenturan dengan pesanan lain. Periksa kembali sebelum menyetujui." } as const;
      }
      const nextStatus = action === "approve" ? "menunggu_pembayaran" : "ditolak";
      const changed = await tx.rental.updateMany({
        where: { id: params.id, rentalStatus: "menunggu_persetujuan", exceptionStatus: null },
        data: action === "approve"
          ? { rentalStatus: nextStatus }
          : { rentalStatus: nextStatus, exceptionStatus: "ditolak", rejectReason },
      });
      if (changed.count !== 1) return null;
      await tx.rentalStatusHistory.create({
        data: {
          rentalId: params.id, actorId: user.id, fromStatus: "menunggu_persetujuan", toStatus: nextStatus,
          reason: action === "reject" ? rejectReason : "Disetujui Admin.",
        },
      });
      const result = await tx.rental.findUnique({
        where: { id: params.id },
        include: { payment: true, unit: { include: { equipment: true } }, statusHistory: { orderBy: { createdAt: "asc" } } },
      });
      return { rental: result } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });
    if (updated && "conflict" in updated) return NextResponse.json({ error: updated.conflict }, { status: 409 });
    if (!updated || !updated.rental) return NextResponse.json({ error: "Pesanan sudah diproses oleh Admin lain. Muat ulang daftar pesanan." }, { status: 409 });
    return NextResponse.json({ message: action === "approve" ? "Pesanan disetujui." : "Pesanan ditolak.", rental: updated.rental });
  } catch (error) {
    console.error("Approve rental failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses persetujuan." }, { status: 500 });
  }
}
