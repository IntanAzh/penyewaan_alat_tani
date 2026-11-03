import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";
import { parseDateOnlyUTC, utcToday } from "@/lib/dateOnly";
import { expireOverduePayments } from "@/lib/paymentExpiry";

const validImage = (value: string) => value.startsWith("/") || /^https?:\/\//i.test(value);

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await expireOverduePayments();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const equipmentId = searchParams.get("equipmentId");
    const startValue = searchParams.get("startDate");
    const endValue = searchParams.get("endDate");
    if (Boolean(startValue) !== Boolean(endValue)) return NextResponse.json({ error: "Tanggal mulai dan tanggal kembali harus diisi bersama." }, { status: 400 });
    const startDate = startValue ? parseDateOnlyUTC(startValue) : null;
    const endDate = endValue ? parseDateOnlyUTC(endValue) : null;
    if (startValue && (!startDate || !endDate)) return NextResponse.json({ error: "Format tanggal tidak valid. Gunakan YYYY-MM-DD." }, { status: 400 });
    if (startDate && endDate && (startDate < utcToday() || startDate > endDate)) return NextResponse.json({ error: "Tanggal lampau atau rentang tanggal tidak valid." }, { status: 400 });
    const includeInactive = searchParams.get("includeInactive") === "true";
    let canSeeInactive = false;
    if (includeInactive) {
      const { user, response } = await requireSessionUser("admin");
      if (response) return response;
      canSeeInactive = Boolean(user);
    }
    const where: any = {};
    if (!canSeeInactive) where.isActive = true;
    if (equipmentId) where.id = equipmentId;
    if (category && category !== "Semua") where.category = category;
    if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
    const equipments = await prisma.equipment.findMany({ where, include: { units: { include: { maintenanceSchedules: { where: { status: "terjadwal" }, orderBy: { startDate: "asc" } } } } }, orderBy: { createdAt: "desc" } });
    const activeUnitIds = equipments.flatMap((item) => item.isActive ? item.units.filter((unit) => unit.conditionStatus === "aktif").map((unit) => unit.id) : []);
    const blockedUnitIds = new Set<string>();
    const maintenanceUnitIds = new Set<string>();
    if (startDate && endDate && activeUnitIds.length) {
      const rentals = await prisma.rental.findMany({
        where: {
          unitId: { in: activeUnitIds },
          rentalStatus: { notIn: ["ditolak", "dibatalkan", "kedaluwarsa", "selesai"] },
          exceptionStatus: null,
          OR: [
            { startDate: { lte: endDate }, endDate: { gte: startDate } },
            { rentalStatus: { in: ["sedang_disewa", "pemeriksaan_pengembalian"] } },
          ],
        },
        select: { unitId: true },
        distinct: ["unitId"],
      });
      for (const rental of rentals) if (rental.unitId) blockedUnitIds.add(rental.unitId);
      const schedules = await prisma.maintenanceSchedule.findMany({
        where: { unitId: { in: activeUnitIds }, status: "terjadwal", startDate: { lte: endDate }, endDate: { gte: startDate } },
        select: { unitId: true }, distinct: ["unitId"],
      });
      for (const schedule of schedules) maintenanceUnitIds.add(schedule.unitId);
    }
    return NextResponse.json(equipments.map((item) => {
      const activeUnits = item.isActive ? item.units.filter((unit) => unit.conditionStatus === "aktif") : [];
      const blockedCount = startDate && endDate ? activeUnits.filter((unit) => blockedUnitIds.has(unit.id) || maintenanceUnitIds.has(unit.id)).length : 0;
      const publicUnits = canSeeInactive
        ? item.units
        : item.units.map((unit) => ({ id: unit.id, conditionStatus: unit.conditionStatus }));
      return { ...item, units: publicUnits, totalActiveUnits: activeUnits.length, blockedUnitsCount: blockedCount, availableUnitsCount: Math.max(0, activeUnits.length - blockedCount) };
    }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get equipment failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengambil katalog." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const dailyRate = Number(body.dailyRate);
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.filter((url: unknown): url is string => typeof url === "string").map((url: string) => url.trim()).filter(Boolean) : [];
    if (imageUrl && !imageUrls.includes(imageUrl)) imageUrls.unshift(imageUrl);
    if (!imageUrls.length && imageUrl) imageUrls.push(imageUrl);
    const unitCodes = Array.isArray(body.unitCodes) ? body.unitCodes.filter((c: unknown): c is string => typeof c === "string").map((c: string) => c.trim().toUpperCase()).filter(Boolean) : [];
    if (!name || name.length > 120 || !category || category.length > 60 || !Number.isSafeInteger(dailyRate) || dailyRate < 1 || !imageUrl || !imageUrls.length || imageUrls.length > 6 || imageUrls.some((url: string) => !validImage(url) || url.length > 2048) || !validImage(imageUrl) || unitCodes.length === 0 || unitCodes.length > 100 || new Set(unitCodes).size !== unitCodes.length || unitCodes.some((code: string) => code.length > 40)) {
      return NextResponse.json({ error: "Nama, kategori, tarif, URL foto, dan kode unit harus valid. Kode unit tidak boleh duplikat." }, { status: 400 });
    }
    const categoryRef = await prisma.equipmentCategory.upsert({ where: { name: category }, create: { name: category }, update: { isActive: true } });
    const equipment = await prisma.equipment.create({
      data: { name, category, categoryId: categoryRef.id, dailyRate, description: typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "", imageUrl, imageUrls, isActive: true, units: { create: unitCodes.map((unitCode: string) => ({ unitCode, conditionStatus: "aktif" })) } },
      include: { units: true },
    });
    return NextResponse.json(equipment, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Nama kategori atau kode unit sudah digunakan." }, { status: 409 });
    console.error("Create equipment failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menambah alat baru." }, { status: 500 });
  }
}
