import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const includeInactive = new URL(req.url).searchParams.get("includeInactive") === "true";
    if (includeInactive) {
      const { response } = await requireSessionUser("admin"); if (response) return response;
      const legacy = await prisma.equipment.findMany({ where: { categoryId: null }, distinct: ["category"], select: { category: true } });
      for (const item of legacy) {
        const category = await prisma.equipmentCategory.upsert({ where: { name: item.category }, create: { name: item.category }, update: {} });
        await prisma.equipment.updateMany({ where: { categoryId: null, category: item.category }, data: { categoryId: category.id } });
      }
    }
    return NextResponse.json(await prisma.equipmentCategory.findMany({ where: includeInactive ? {} : { isActive: true }, include: { _count: { select: { equipments: true } } }, orderBy: { name: "asc" } }));
  } catch (error) { console.error("Get categories failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal mengambil kategori." }, { status: 500 }); }
}

export async function POST(req: Request) {
  const { response } = await requireSessionUser("admin"); if (response) return response;
  try {
    const body = await req.json(); const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return NextResponse.json({ error: "Nama kategori wajib diisi (maks. 60 karakter)." }, { status: 400 });
    return NextResponse.json(await prisma.equipmentCategory.create({ data: { name } }), { status: 201 });
  } catch (error: any) { if (error?.code === "P2002") return NextResponse.json({ error: "Kategori sudah ada." }, { status: 409 }); console.error("Create category failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal membuat kategori." }, { status: 500 }); }
}
