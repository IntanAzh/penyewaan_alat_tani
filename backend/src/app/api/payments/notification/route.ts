import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
    } = body;

    // Verify SHA-512 Signature Key for security
    const isValidSignature = verifyMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValidSignature && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Invalid Signature Key" }, { status: 403 });
    }

    const rental = await prisma.rental.findUnique({
      where: { orderCode: order_id },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental order not found" }, { status: 404 });
    }

    let newPaymentStatus = "tertunda";
    let newRentalStatus = rental.rentalStatus;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      newPaymentStatus = "berhasil";
      newRentalStatus = "siap_diambil";
    } else if (transaction_status === "pending") {
      newPaymentStatus = "tertunda";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      newPaymentStatus = transaction_status === "expire" ? "kedaluwarsa" : "gagal";
      newRentalStatus = "kedaluwarsa";
    }

    // Update payment record
    await prisma.payment.update({
      where: { rentalId: rental.id },
      data: {
        paymentStatus: newPaymentStatus,
        paymentMethod: payment_type || "Midtrans",
        paidAt: newPaymentStatus === "berhasil" ? new Date() : undefined,
      },
    });

    // Update rental status
    await prisma.rental.update({
      where: { id: rental.id },
      data: {
        rentalStatus: newRentalStatus,
        exceptionStatus: newRentalStatus === "kedaluwarsa" ? "kedaluwarsa" : undefined,
      },
    });

    return NextResponse.json({ message: "Notification processed successfully" });
  } catch (error) {
    console.error("Webhook Notification Error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
