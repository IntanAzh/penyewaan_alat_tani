import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMidtransSnapToken } from "@/lib/midtrans";
import { requireSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { user, response } = await requireSessionUser("penyewa");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const body = await req.json();
    const rentalId = typeof body.rentalId === "string" ? body.rentalId : "";
    if (!rentalId) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { user: true, equipmentRef: true, unit: { include: { equipment: true } }, payment: true },
    });
    if (!rental || rental.userId !== user.id) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_pembayaran" || !rental.unitId || rental.payment?.paymentStatus === "berhasil") {
      return NextResponse.json({ error: "Pesanan belum disetujui atau sudah lunas." }, { status: 409 });
    }
    if (rental.payment?.paymentDeadline && rental.payment.paymentDeadline <= new Date()) return NextResponse.json({ error: "Batas pembayaran 24 jam telah berakhir. Pesanan tidak dapat dibayar lagi." }, { status: 409 });
    if (!rental.payment || rental.payment.amount !== rental.totalRentalFee) {
      return NextResponse.json({ error: "Nominal pembayaran tidak cocok dengan tagihan pesanan. Hubungi Admin." }, { status: 409 });
    }
    if (rental.payment.paymentStatus === "tertunda" && rental.payment.snapToken) {
      return NextResponse.json({ snapToken: rental.payment.snapToken, reused: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const equipment = rental.unit?.equipment || rental.equipmentRef;
    if (!equipment) return NextResponse.json({ error: "Data alat pada pesanan tidak tersedia." }, { status: 409 });
    const snapResult = await createMidtransSnapToken({
      orderId: rental.orderCode,
      grossAmount: rental.totalRentalFee,
      customerDetails: { first_name: rental.user.name, email: rental.user.email, phone: rental.user.phone },
      itemDetails: [{ id: equipment.id, name: `${equipment.name} (${rental.durationDays} Hari)`, price: rental.totalRentalFee, quantity: 1 }],
    });

    const payment = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { rentalId } });
      const currentRental = await tx.rental.findUnique({ where: { id: rentalId }, select: { rentalStatus: true, totalRentalFee: true, userId: true } });
      if (!current || !currentRental || currentRental.userId !== user.id || currentRental.rentalStatus !== "menunggu_pembayaran" || current.paymentStatus === "berhasil" || current.amount !== currentRental.totalRentalFee || (current.paymentDeadline && current.paymentDeadline <= new Date())) return null;
      return tx.payment.update({
        where: { rentalId },
        data: { snapToken: snapResult.token, paymentStatus: "tertunda", amount: currentRental.totalRentalFee, gatewayStatus: null, gatewayTransactionId: null },
      });
    });
    if (!payment) return NextResponse.json({ error: "Status pesanan berubah saat transaksi pembayaran dibuat. Muat ulang pesanan." }, { status: 409 });
    return NextResponse.json({ snapToken: payment.snapToken, redirectUrl: snapResult.redirect_url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Create payment session failed.", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error && error.message.includes("MIDTRANS_")
      ? "Konfigurasi Midtrans belum lengkap atau tidak cocok dengan lingkungan pembayaran."
      : error instanceof Error ? error.message : "Gateway pembayaran gagal membuat transaksi.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
