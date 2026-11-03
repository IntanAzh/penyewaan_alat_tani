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
      include: { user: true, unit: { include: { equipment: true } }, payment: true },
    });
    if (!rental || rental.userId !== user.id) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_pembayaran" || rental.payment?.paymentStatus === "berhasil") {
      return NextResponse.json({ error: "Pesanan belum dapat dibayar atau sudah lunas." }, { status: 409 });
    }

    const snapResult = await createMidtransSnapToken({
      orderId: rental.orderCode,
      grossAmount: rental.totalRentalFee,
      customerDetails: { first_name: rental.user.name, email: rental.user.email, phone: rental.user.phone },
      itemDetails: [{ id: rental.unit.equipment.id, name: `${rental.unit.equipment.name} (${rental.durationDays} Hari)`, price: rental.totalRentalFee, quantity: 1 }],
    });
    await prisma.payment.upsert({
      where: { rentalId },
      create: { rentalId, snapToken: snapResult.token, amount: rental.totalRentalFee, paymentStatus: "tertunda" },
      update: { snapToken: snapResult.token, paymentStatus: "tertunda" },
    });
    return NextResponse.json({ snapToken: snapResult.token, redirectUrl: snapResult.redirect_url });
  } catch (error) {
    console.error("Create payment session failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal membuat token pembayaran." }, { status: 500 });
  }
}

// Local-only payment simulation. Production payment state is set by the signed gateway notification.
export async function PUT(req: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Endpoint tidak tersedia." }, { status: 404 });
  try {
    const { user, response } = await requireSessionUser("penyewa");
    if (response) return response;
    if (!user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const body = await req.json();
    const rentalId = typeof body.rentalId === "string" ? body.rentalId : "";
    const rental = await prisma.rental.findUnique({ where: { id: rentalId }, include: { payment: true } });
    if (!rental || rental.userId !== user.id) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (rental.rentalStatus !== "menunggu_pembayaran" || !rental.payment) return NextResponse.json({ error: "Pesanan belum dapat dibayar." }, { status: 409 });
    const [payment] = await prisma.$transaction([
      prisma.payment.update({ where: { rentalId }, data: { paymentStatus: "berhasil", paymentMethod: "Sandbox Demo", paidAt: new Date() } }),
      prisma.rental.update({ where: { id: rentalId }, data: { rentalStatus: "siap_diambil" } }),
    ]);
    return NextResponse.json({ message: "Pembayaran sandbox tercatat.", payment });
  } catch (error) {
    console.error("Sandbox payment simulation failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mencatat simulasi pembayaran." }, { status: 500 });
  }
}

