import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_LOCAL_PAYMENT_SIMULATION !== "true") {
    return NextResponse.json({ error: "Simulasi pembayaran tidak diaktifkan." }, { status: 404 });
  }
  try {
    const { user, response } = await requireSessionUser("penyewa");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const body = await req.json();
    const rentalId = typeof body.rentalId === "string" ? body.rentalId : "";
    const result = await prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findFirst({ where: { id: rentalId, userId: user.id }, include: { payment: true } });
      if (!rental) return { error: "Pesanan tidak ditemukan.", status: 404 } as const;
      if (rental.rentalStatus !== "menunggu_pembayaran" || !rental.unitId || !rental.payment || rental.payment.amount !== rental.totalRentalFee || rental.payment.paymentStatus === "berhasil") {
        return { error: "Pesanan belum dapat disimulasikan atau statusnya sudah berubah.", status: 409 } as const;
      }
      const changed = await tx.rental.updateMany({ where: { id: rental.id, rentalStatus: "menunggu_pembayaran" }, data: { rentalStatus: "siap_diambil" } });
      if (changed.count !== 1) return { error: "Pesanan sudah diproses.", status: 409 } as const;
      const payment = await tx.payment.update({ where: { rentalId: rental.id }, data: { paymentStatus: "berhasil", paymentMethod: "Simulasi Lokal", paidAt: new Date(), gatewayStatus: "local_simulation" } });
      await tx.rentalStatusHistory.create({ data: { rentalId: rental.id, actorId: user.id, fromStatus: "menunggu_pembayaran", toStatus: "siap_diambil", reason: "Pembayaran simulasi lokal; bukan transaksi gateway." } });
      return { payment } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: "Simulasi lokal berhasil dicatat.", payment: result.payment });
  } catch (error) {
    console.error("Local payment simulation failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Simulasi pembayaran gagal." }, { status: 500 });
  }
}
