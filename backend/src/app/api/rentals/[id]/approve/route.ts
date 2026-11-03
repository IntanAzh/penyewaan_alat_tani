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

    const rental = await prisma.rental.findUnique({ where: { id: params.id }, select: { id: true, rentalStatus: true, equipmentId: true, unitId: true, startDate: true, endDate: true } });
    if (!rental) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_persetujuan") return NextResponse.json({ error: "Pesanan sudah diproses." }, { status: 409 });

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "approve") {
        const currentUnit = rental.unitId ? await tx.equipmentUnit.findUnique({ where: { id: rental.unitId }, select: { equipmentId: true } }) : null;
        const equipmentId = rental.equipmentId || currentUnit?.equipmentId;
        if (!equipmentId) return { conflict: "Jenis alat pada pesanan tidak tersedia. Periksa data alat sebelum menyetujui." } as const;
        const equipment = await tx.equipment.findUnique({ where: { id: equipmentId }, select: { isActive: true } });
        if (!equipment?.isActive) return { conflict: "Alat tidak lagi aktif untuk penyewaan." } as const;

        // The unit is physically allocated only after approval. Locks serialize Admin decisions per equipment.
        const units = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM EquipmentUnit
          WHERE equipmentId = ${equipmentId} AND conditionStatus = 'aktif'
          ORDER BY id FOR UPDATE
        `;
        let selectedUnitId: string | null = null;
        for (const unit of units) {
          const overlapping = await tx.rental.findFirst({
            where: {
              id: { not: params.id }, unitId: unit.id,
              rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] }, exceptionStatus: null,
              OR: [
                { startDate: { lte: rental.endDate }, endDate: { gte: rental.startDate } },
                { rentalStatus: { in: ["sedang_disewa", "pemeriksaan_pengembalian"] } },
              ],
            }, select: { id: true },
          });
          if (overlapping) continue;
          const maintenance = await tx.maintenanceSchedule.findFirst({ where: { unitId: unit.id, status: "terjadwal", startDate: { lte: rental.endDate }, endDate: { gte: rental.startDate } }, select: { id: true } });
          if (maintenance) continue;
          selectedUnitId = unit.id;
          break;
        }
        if (!selectedUnitId) return { conflict: "Tidak ada unit aktif yang tersedia pada rentang ini. Pesanan belum disetujui." } as const;

        const payment = await tx.payment.findUnique({ where: { rentalId: params.id } });
        if (!payment || payment.amount <= 0) return { conflict: "Tagihan pembayaran pesanan tidak valid." } as const;
        const paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const nextStatus = "menunggu_pembayaran";
        const changed = await tx.rental.updateMany({
          where: { id: params.id, rentalStatus: "menunggu_persetujuan", exceptionStatus: null },
          data: { rentalStatus: nextStatus, unitId: selectedUnitId, equipmentId },
        });
        if (changed.count !== 1) return null;
        await tx.payment.update({ where: { rentalId: params.id }, data: { paymentDeadline } });
        await tx.rentalStatusHistory.create({ data: { rentalId: params.id, actorId: user.id, fromStatus: "menunggu_persetujuan", toStatus: nextStatus, reason: `Disetujui Admin; unit ${units.find((unit) => unit.id === selectedUnitId)?.id || "fisik"} dialokasikan. Batas pembayaran 24 jam.` } });
        const approved = await tx.rental.findUnique({ where: { id: params.id }, include: { payment: true, equipmentRef: true, unit: { include: { equipment: true } }, statusHistory: { orderBy: { createdAt: "asc" } } } });
        return { rental: approved } as const;
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
        include: { payment: true, equipmentRef: true, unit: { include: { equipment: true } }, statusHistory: { orderBy: { createdAt: "asc" } } },
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
