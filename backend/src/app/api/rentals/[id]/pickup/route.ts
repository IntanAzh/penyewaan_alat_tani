import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { response } = await requireSessionUser("admin");
    if (response) return response;
    const body = await req.json();
    const initialConditionNotes = typeof body.initialConditionNotes === "string" ? body.initialConditionNotes.trim().slice(0, 2000) : "";
    if (!initialConditionNotes) return NextResponse.json({ error: "Catatan kondisi awal wajib diisi." }, { status: 400 });
    const rental = await prisma.rental.findUnique({ where: { id: params.id }, include: { payment: true } });
    if (!rental) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    const isPaid = rental.payment?.paymentStatus === "berhasil";
    const canPickup = isPaid && (rental.rentalStatus === "siap_diambil" || rental.rentalStatus === "menunggu_pembayaran");
    if (!canPickup) {
      return NextResponse.json({ error: "Pesanan harus sudah lunas dan siap diambil." }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.rental.updateMany({
        where: { id: params.id, rentalStatus: { in: ["siap_diambil", "menunggu_pembayaran"] } },
        data: { rentalStatus: "sedang_disewa" }
      });
      if (result.count !== 1) throw new Error("HANDOVER_CONFLICT");
      await tx.returnRecord.upsert({
        where: { rentalId: params.id },
        create: { rentalId: params.id, initialConditionNotes, finalConditionNotes: "-" },
        update: { initialConditionNotes },
      });
      return tx.rental.findUnique({ where: { id: params.id } });
    });
    return NextResponse.json({ message: "Penyerahan berhasil dicatat.", rental: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "HANDOVER_CONFLICT") return NextResponse.json({ error: "Pesanan sudah diproses." }, { status: 409 });
    console.error("Handover failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses penyerahan alat." }, { status: 500 });
  }
}
