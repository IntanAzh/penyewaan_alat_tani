import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const body = await req.json();
    const action = body.action;
    const rejectReason = typeof body.rejectReason === "string" ? body.rejectReason.trim().slice(0, 500) : "";
    if (action !== "approve" && action !== "reject") return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
    if (action === "reject" && !rejectReason) return NextResponse.json({ error: "Alasan penolakan wajib diisi." }, { status: 400 });

    const rental = await prisma.rental.findUnique({ where: { id: params.id }, select: { id: true, rentalStatus: true } });
    if (!rental) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_persetujuan") return NextResponse.json({ error: "Pesanan sudah diproses." }, { status: 409 });

    const updated = await prisma.rental.update({
      where: { id: params.id },
      data: action === "approve"
        ? { rentalStatus: "menunggu_pembayaran" }
        : { rentalStatus: "ditolak", exceptionStatus: "ditolak", rejectReason },
      include: action === "approve" ? { payment: true, unit: { include: { equipment: true } } } : undefined,
    });
    return NextResponse.json({ message: action === "approve" ? "Pesanan disetujui." : "Pesanan ditolak.", rental: updated });
  } catch (error) {
    console.error("Approve rental failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses persetujuan." }, { status: 500 });
  }
}
