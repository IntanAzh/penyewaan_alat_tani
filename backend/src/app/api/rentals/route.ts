import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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
  try {
    const { user, response } = await requireSessionUser("penyewa");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

    const body = await req.json();
    const equipmentId = typeof body.equipmentId === "string" ? body.equipmentId : "";
    const startDateStr = typeof body.startDateStr === "string" ? body.startDateStr : "";
    const endDateStr = typeof body.endDateStr === "string" ? body.endDateStr : "";
    if (!equipmentId || !DATE_ONLY.test(startDateStr) || !DATE_ONLY.test(endDateStr)) {
      return NextResponse.json({ error: "Formulir pemesanan belum lengkap atau tanggal tidak valid." }, { status: 400 });
    }

    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    const end = new Date(`${endDateStr}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: "Rentang tanggal sewa tidak valid." }, { status: 400 });
    }
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (start < todayUtc) return NextResponse.json({ error: "Tanggal mulai tidak boleh di masa lalu." }, { status: 400 });
    const durationDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId }, include: { units: true } });
    if (!equipment) return NextResponse.json({ error: "Alat tidak ditemukan." }, { status: 404 });

    const activeUnits = equipment.units.filter((unit) => unit.conditionStatus === "aktif");
    let selectedUnit = null;
    for (const unit of activeUnits) {
      const overlapping = await prisma.rental.findFirst({
        where: {
          unitId: unit.id,
          rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa"] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
        select: { id: true },
      });
      if (!overlapping) { selectedUnit = unit; break; }
    }
    if (!selectedUnit) return NextResponse.json({ error: "Tidak ada unit tersedia pada rentang tanggal tersebut." }, { status: 409 });

    const orderCode = `ORD-${startDateStr.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const totalRentalFee = durationDays * equipment.dailyRate;
    const rental = await prisma.rental.create({
      data: {
        orderCode,
        userId: user.id,
        unitId: selectedUnit.id,
        startDate: start,
        endDate: end,
        durationDays,
        dailyRate: equipment.dailyRate,
        totalRentalFee,
        rentalStatus: "menunggu_persetujuan",
        payment: { create: { amount: totalRentalFee, paymentStatus: "belum_dibayar" } },
      },
      include: { unit: { include: { equipment: true } }, payment: true },
    });
    return NextResponse.json({ message: "Pesanan berhasil diajukan.", rental }, { status: 201 });
  } catch (error) {
    console.error("Create rental failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengajukan pemesanan." }, { status: 500 });
  }
}

