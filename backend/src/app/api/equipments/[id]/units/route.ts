import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSessionUser("admin"); if (response) return response;
  try {
    const { id } = await params; const body = await req.json();
    const codes = Array.isArray(body.unitCodes) ? body.unitCodes.filter((v: unknown): v is string => typeof v === "string").map((v: string) => v.trim().toUpperCase()).filter(Boolean) : [];
    if (!codes.length || codes.length > 100 || new Set(codes).size !== codes.length || codes.some((c: string) => c.length > 40)) return NextResponse.json({ error: "Masukkan kode unit unik dan valid." }, { status: 400 });
    if (!await prisma.equipment.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Data alat tidak ditemukan." }, { status: 404 });
    const result = await prisma.equipmentUnit.createMany({ data: codes.map((unitCode: string) => ({ equipmentId: id, unitCode, conditionStatus: "aktif" })) });
    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error: any) { if (error?.code === "P2002") return NextResponse.json({ error: "Kode unit sudah terdaftar." }, { status: 409 }); console.error("Add units failed.", error instanceof Error ? error.message : "Unknown error"); return NextResponse.json({ error: "Gagal menambahkan unit." }, { status: 500 }); }
}
