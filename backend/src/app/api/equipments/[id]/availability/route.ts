import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ACTIVE_RENTAL_STATUSES = ["sedang_disewa", "pemeriksaan_pengembalian"];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const monthValue = new URL(req.url).searchParams.get("month") || "";
    const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
    if (!match) return NextResponse.json({ error: "Bulan wajib diisi dengan format YYYY-MM." }, { status: 400 });
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (year < 2000 || year > 2100 || monthIndex < 0 || monthIndex > 11) return NextResponse.json({ error: "Bulan tidak valid." }, { status: 400 });

    const equipment = await prisma.equipment.findUnique({ where: { id }, include: { units: { select: { id: true, conditionStatus: true } } } });
    if (!equipment || !equipment.isActive) return NextResponse.json({ error: "Alat tidak ditemukan." }, { status: 404 });

    const monthStart = new Date(Date.UTC(year, monthIndex, 1));
    const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1));
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const rentableUnits = equipment.units.filter((unit) => unit.conditionStatus === "aktif");
    const maintenanceUnitsCount = equipment.units.filter((unit) => unit.conditionStatus === "perawatan").length;
    const rentableUnitIds = rentableUnits.map((unit) => unit.id);
    const rentals = rentableUnitIds.length ? await prisma.rental.findMany({
      where: {
        unitId: { in: rentableUnitIds },
        rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] },
        exceptionStatus: null,
        OR: [
          { startDate: { lt: nextMonth }, endDate: { gte: monthStart } },
          { rentalStatus: { in: ACTIVE_RENTAL_STATUSES } },
        ],
      },
      select: { unitId: true, startDate: true, endDate: true, rentalStatus: true },
    }) : [];
    const schedules = rentableUnitIds.length ? await prisma.maintenanceSchedule.findMany({
      where: { unitId: { in: rentableUnitIds }, status: "terjadwal", startDate: { lt: nextMonth }, endDate: { gte: monthStart } },
      select: { unitId: true, startDate: true, endDate: true },
    }) : [];

    const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(Date.UTC(year, monthIndex, index + 1));
      const busyUnits = new Set(rentals.filter((rental) => {
        const overlaps = rental.startDate <= date && rental.endDate >= date;
        const stillInUse = ACTIVE_RENTAL_STATUSES.includes(rental.rentalStatus) && rental.startDate <= date;
        return overlaps || stillInUse;
      }).map((rental) => rental.unitId));
      const maintainedUnits = new Set(schedules.filter((schedule) => schedule.startDate <= date && schedule.endDate >= date).map((schedule) => schedule.unitId));
      for (const unitId of maintainedUnits) busyUnits.add(unitId);
      const bookedUnitsCount = busyUnits.size;
      return {
        date: date.toISOString().slice(0, 10),
        availableUnitsCount: Math.max(0, rentableUnits.length - bookedUnitsCount),
        bookedUnitsCount,
        maintenanceUnitsCount: new Set([...equipment.units.filter((unit) => unit.conditionStatus === "perawatan").map((unit) => unit.id), ...maintainedUnits]).size,
      };
    });

    return NextResponse.json({ equipmentId: equipment.id, month: monthValue, totalActiveUnits: rentableUnits.length, calendarDays }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get equipment availability failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengambil kalender ketersediaan." }, { status: 500 });
  }
}
