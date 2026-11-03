import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSessionUser("admin");
  if (response) return response;
  try {
    const { id } = await params;
    const body = await req.json();
    const old = await prisma.equipment.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: "Data alat tidak ditemukan." }, { status: 404 });
    const data: any = {};
    if (body.name !== undefined) { if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) return NextResponse.json({ error: "Nama alat tidak valid." }, { status: 400 }); data.name = body.name.trim(); }
    if (body.dailyRate !== undefined) { const rate = Number(body.dailyRate); if (!Number.isSafeInteger(rate) || rate < 1) return NextResponse.json({ error: "Tarif harian tidak valid." }, { status: 400 }); data.dailyRate = rate; }
    if (typeof body.description === "string") data.description = body.description.trim().slice(0, 2000);
    if (typeof body.imageUrl === "string") { const url = body.imageUrl.trim(); if (!(url.startsWith("/") || /^https?:\/\//i.test(url))) return NextResponse.json({ error: "URL foto tidak valid." }, { status: 400 }); data.imageUrl = url; }
    if (body.imageUrls !== undefined) {
      if (!Array.isArray(body.imageUrls)) return NextResponse.json({ error: "Galeri foto harus berupa daftar URL." }, { status: 400 });
      const urls = body.imageUrls.filter((url: unknown): url is string => typeof url === "string").map((url: string) => url.trim()).filter(Boolean);
      if (!urls.length || urls.length > 6 || urls.some((url: string) => !(url.startsWith("/") || /^https?:\/\//i.test(url)) || url.length > 2048)) return NextResponse.json({ error: "Isi 1–6 URL foto yang valid." }, { status: 400 });
      data.imageUrls = urls;
      if (typeof body.imageUrl !== "string") data.imageUrl = urls[0];
      else if (!urls.includes(data.imageUrl)) data.imageUrls = [data.imageUrl, ...urls].slice(0, 6);
    }
    if (typeof body.category === "string") { const category = body.category.trim(); if (!category || category.length > 60) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 }); const ref = await prisma.equipmentCategory.upsert({ where: { name: category }, create: { name: category }, update: { isActive: true } }); data.category = category; data.categoryId = ref.id; }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    return NextResponse.json(await prisma.equipment.update({ where: { id }, data, include: { units: true } }));
  } catch (error) { console.error("Update equipment failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal memperbarui data alat." }, { status: 500 }); }
}
