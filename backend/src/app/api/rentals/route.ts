import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { parseDateOnlyUTC, utcToday } from "@/lib/dateOnly";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireSessionUser();
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

    const rentals = await prisma.rental.findMany({
      where: user.role === "admin" ? {} : { userId: user.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        unit: { include: { equipment: true } },
        payment: true,
        returnRecord: true,
        statusHistory: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true, role: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rentals, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get rentals failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengambil data pesanan." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let authenticatedUserId = "";
  let requestIdentity: { equipmentId: string; start: Date; end: Date } | null = null;
  try {
    const { user, response } = await requireSessionUser("penyewa");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    authenticatedUserId = user.id;

    const body = await req.json();
    const requestKey = req.headers.get("Idempotency-Key")?.trim() || "";
    if (!/^[A-Za-z0-9._:-]{16,64}$/.test(requestKey)) {
      return NextResponse.json({ error: "Kunci pengajuan tidak valid. Silakan muat ulang halaman dan coba kembali." }, { status: 400 });
    }
    const equipmentId = typeof body.equipmentId === "string" ? body.equipmentId : "";
    const startDateStr = typeof body.startDateStr === "string" ? body.startDateStr : "";
    const endDateStr = typeof body.endDateStr === "string" ? body.endDateStr : "";
    if (!equipmentId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Formulir pemesanan belum lengkap atau tanggal tidak valid." }, { status: 400 });
    }

    const start = parseDateOnlyUTC(startDateStr);
    const end = parseDateOnlyUTC(endDateStr);
    if (!start || !end || start > end) {
      return NextResponse.json({ error: "Rentang tanggal sewa tidak valid." }, { status: 400 });
    }
    requestIdentity = { equipmentId, start, end };
    if (start < utcToday()) return NextResponse.json({ error: "Tanggal mulai tidak boleh di masa lalu." }, { status: 400 });
    const durationDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    const previousRequest = await prisma.rental.findUnique({ where: { requestKey }, include: { unit: { include: { equipment: true } }, payment: true } });
    if (previousRequest) {
      const matches = previousRequest.userId === user.id && previousRequest.unit.equipment.id === equipmentId
        && previousRequest.startDate.getTime() === start.getTime() && previousRequest.endDate.getTime() === end.getTime();
      if (!matches) return NextResponse.json({ error: "Kunci pengajuan sudah digunakan untuk data pesanan yang berbeda." }, { status: 409 });
      return NextResponse.json({ message: "Pengajuan ini sudah tercatat.", rental: previousRequest, replayed: true }, { status: 200 });
    }

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) return NextResponse.json({ error: "Alat tidak ditemukan." }, { status: 404 });
    if (!equipment.isActive) return NextResponse.json({ error: "Alat sedang tidak tersedia untuk pesanan baru." }, { status: 409 });

    const orderCode = `ORD-${startDateStr.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const dailyRate = Math.round(equipment.dailyRate);
    const totalRentalFee = durationDays * dailyRate;
    const rental = await prisma.$transaction(async (tx) => {
      // Lock all eligible physical units so concurrent requests cannot reserve the same unit/date range.
      const units = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM EquipmentUnit
        WHERE equipmentId = ${equipmentId} AND conditionStatus = 'aktif'
        ORDER BY id FOR UPDATE
      `;
      for (const unit of units) {
        const overlapping = await tx.rental.findFirst({
          where: {
            unitId: unit.id,
            rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] },
            exceptionStatus: null,
            OR: [
              { startDate: { lte: end }, endDate: { gte: start } },
              { rentalStatus: { in: ["sedang_disewa", "pemeriksaan_pengembalian"] } },
            ],
          },
          select: { id: true },
        });
        if (overlapping) continue;

        const created = await tx.rental.create({
          data: {
            orderCode, requestKey, userId: user.id, unitId: unit.id,
            startDate: start, endDate: end, durationDays, dailyRate, totalRentalFee,
            rentalStatus: "menunggu_persetujuan",
            payment: { create: { amount: totalRentalFee, paymentStatus: "belum_dibayar" } },
            statusHistory: { create: { actorId: user.id, toStatus: "menunggu_persetujuan", reason: "Pengajuan pesanan dibuat." } },
          },
          include: { unit: { include: { equipment: true } }, payment: true },
        });
        return created;
      }
      throw new Error("NO_AVAILABLE_UNIT");
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });
    return NextResponse.json({ message: "Pesanan berhasil diajukan.", rental }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_AVAILABLE_UNIT") {
      return NextResponse.json({ error: "Tidak ada unit tersedia pada rentang tanggal tersebut. Jadwal baru saja berubah, silakan pilih tanggal lain." }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2002") {
      const requestKey = req.headers.get("Idempotency-Key")?.trim() || "";
      const prior = requestKey ? await prisma.rental.findUnique({ where: { requestKey }, include: { unit: { include: { equipment: true } }, payment: true } }) : null;
      const isSameRequest = prior && requestIdentity && prior.userId === authenticatedUserId
        && prior.unit.equipment.id === requestIdentity.equipmentId
        && prior.startDate.getTime() === requestIdentity.start.getTime()
        && prior.endDate.getTime() === requestIdentity.end.getTime();
      if (isSameRequest) {
        return NextResponse.json({ message: "Pengajuan ini sudah tercatat.", rental: prior, replayed: true }, { status: 200 });
      }
      return NextResponse.json({ error: "Permintaan yang sama sedang diproses atau kode pesanan bentrok. Silakan muat ulang data pesanan." }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2034") {
      return NextResponse.json({ error: "Jadwal baru saja berubah. Silakan periksa ketersediaan lalu coba kembali." }, { status: 409 });
    }
    console.error("Create rental failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengajukan pemesanan." }, { status: 500 });
  }
}

