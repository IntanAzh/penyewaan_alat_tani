import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSessionUser("admin"); if (response) return response;
  try {
    const { id } = await params; const body = await req.json(); const allowed = ["aktif", "perawatan", "rusak", "nonaktif"];
    if (typeof body.conditionStatus !== "string" || !allowed.includes(body.conditionStatus)) return NextResponse.json({ error: "Status unit tidak valid." }, { status: 400 });
    const unit = await prisma.equipmentUnit.findUnique({ where: { id }, include: { rentals: { where: { rentalStatus: { notIn: ["selesai", "ditolak", "dibatalkan", "kedaluwarsa"] } }, select: { id: true } } } });
    if (!unit) return NextResponse.json({ error: "Unit tidak ditemukan." }, { status: 404 });
    if (body.conditionStatus !== "aktif" && unit.rentals.length) return NextResponse.json({ error: "Status unit terkunci karena masih memiliki pesanan aktif." }, { status: 409 });
    const data: any = { conditionStatus: body.conditionStatus }; if (typeof body.notes === "string") data.notes = body.notes.trim().slice(0, 1000);
    return NextResponse.json(await prisma.equipmentUnit.update({ where: { id }, data }));
  } catch (error) { console.error("Update unit failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal memperbarui status unit." }, { status: 500 }); }
}
