import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSessionUser("admin"); if (response) return response;
  try {
    const { id } = await params; const body = await req.json(); const data: any = {};
    if (typeof body.name === "string") { const name = body.name.trim(); if (!name || name.length > 60) return NextResponse.json({ error: "Nama kategori tidak valid." }, { status: 400 }); data.name = name; }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (!Object.keys(data).length) return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
    const category = await prisma.equipmentCategory.update({ where: { id }, data });
    if (data.name) await prisma.equipment.updateMany({ where: { categoryId: id }, data: { category: data.name } });
    return NextResponse.json(category);
  } catch (error: any) { if (error?.code === "P2002") return NextResponse.json({ error: "Nama kategori sudah digunakan." }, { status: 409 }); if (error?.code === "P2025") return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 }); console.error("Update category failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal memperbarui kategori." }, { status: 500 }); }
}
