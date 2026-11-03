import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const where: any = {};
    if (category && category !== "Semua") where.category = category;
    if (search) where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
    const equipments = await prisma.equipment.findMany({ where, include: { units: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(equipments.map((item) => ({
      ...item,
      availableUnitsCount: item.units.filter((unit) => unit.conditionStatus === "aktif").length,
    })), { headers: { "Cache-Control": "no-store" } });
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
    const unitCodes = Array.isArray(body.unitCodes) ? body.unitCodes.filter((code: unknown): code is string => typeof code === "string").map((code: string) => code.trim()).filter(Boolean) : [];
    if (!name || !category || !Number.isSafeInteger(dailyRate) || dailyRate < 1 || !imageUrl || unitCodes.length === 0) {
      return NextResponse.json({ error: "Data alat atau kode unit belum valid." }, { status: 400 });
    }
    const equipment = await prisma.equipment.create({
      data: { name, category, dailyRate, description: typeof body.description === "string" ? body.description.trim() : "", imageUrl, units: { create: unitCodes.map((unitCode: string) => ({ unitCode, conditionStatus: "aktif" })) } },
      include: { units: true },
    });
    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error("Create equipment failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menambah alat baru." }, { status: 500 });
  }
}
