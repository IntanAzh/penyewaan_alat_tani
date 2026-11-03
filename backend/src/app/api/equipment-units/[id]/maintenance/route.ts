import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { parseDateOnlyUTC } from "@/lib/dateOnly";

type Context = { params: { id: string } | Promise<{ id: string }> };

export async function GET(_req: Request, context: Context) {
  const { response } = await requireSessionUser("admin");
  if (response) return response;
  const { id } = await context.params;
  return NextResponse.json(await prisma.maintenanceSchedule.findMany({ where: { unitId: id }, orderBy: { startDate: "desc" } }), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, context: Context) {
  const { response } = await requireSessionUser("admin");
  if (response) return response;
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Data perawatan tidak valid." }, { status: 400 }); }
  const startDate = parseDateOnlyUTC(body.startDate);
  const endDate = parseDateOnlyUTC(body.endDate);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (!startDate || !endDate || startDate > endDate || startDate < today || reason.length < 5 || reason.length > 500) return NextResponse.json({ error: "Tanggal perawatan harus valid mulai hari ini dan alasan 5–500 karakter." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const units = await tx.$queryRaw<Array<{ id: string; conditionStatus: string }>>`SELECT id, conditionStatus FROM EquipmentUnit WHERE id = ${id} FOR UPDATE`;
      if (!units.length) return { kind: "missing" as const };
      if (units[0].conditionStatus !== "aktif") return { kind: "inactive" as const };
      const rental = await tx.rental.findFirst({ where: { unitId: id, rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] }, exceptionStatus: null, OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }, { rentalStatus: { in: ["sedang_disewa", "pemeriksaan_pengembalian"] } }] }, select: { id: true } });
      if (rental) return { kind: "rental" as const };
      const overlap = await tx.maintenanceSchedule.findFirst({ where: { unitId: id, status: "terjadwal", startDate: { lte: endDate }, endDate: { gte: startDate } }, select: { id: true } });
      if (overlap) return { kind: "overlap" as const };
      return { kind: "ok" as const, schedule: await tx.maintenanceSchedule.create({ data: { unitId: id, startDate, endDate, reason } }) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });
    if (result.kind === "missing") return NextResponse.json({ error: "Unit tidak ditemukan." }, { status: 404 });
    if (result.kind === "inactive") return NextResponse.json({ error: "Jadwal hanya dapat dibuat untuk unit aktif." }, { status: 409 });
    if (result.kind === "rental") return NextResponse.json({ error: "Unit memiliki pesanan yang bertabrakan." }, { status: 409 });
    if (result.kind === "overlap") return NextResponse.json({ error: "Jadwal perawatan lain bertabrakan." }, { status: 409 });
    return NextResponse.json(result.schedule, { status: 201 });
  } catch (error) {
    console.error("Create maintenance schedule failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal membuat jadwal perawatan." }, { status: 500 });
  }
}
