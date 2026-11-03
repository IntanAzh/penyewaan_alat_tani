import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMidtransTransactionStatus, midtransEventKey, verifyMidtransSignature } from "@/lib/midtrans";

type MidtransNotification = {
  order_id?: unknown; status_code?: unknown; gross_amount?: unknown; signature_key?: unknown;
  transaction_id?: unknown; transaction_status?: unknown; payment_type?: unknown; currency?: unknown;
  fraud_status?: unknown;
};

function amountInRupiah(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

export async function POST(req: Request) {
  let body: MidtransNotification;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Payload notifikasi tidak valid." }, { status: 400 }); }
  const { order_id, status_code, gross_amount, signature_key, transaction_id, transaction_status } = body;
  if (typeof order_id !== "string" || typeof status_code !== "string" || typeof gross_amount !== "string" || typeof signature_key !== "string" || typeof transaction_id !== "string" || typeof transaction_status !== "string") {
    return NextResponse.json({ error: "Referensi atau data transaksi tidak lengkap." }, { status: 400 });
  }
  if (body.currency !== "IDR") return NextResponse.json({ error: "Mata uang transaksi tidak valid atau tidak didukung." }, { status: 400 });
  if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) return NextResponse.json({ error: "Signature notifikasi tidak valid." }, { status: 403 });
  const amount = amountInRupiah(gross_amount);
  if (amount === null) return NextResponse.json({ error: "Nominal transaksi tidak valid." }, { status: 400 });

  let verified: Record<string, unknown>;
  try { verified = await getMidtransTransactionStatus(order_id); }
  catch (error) {
    console.error("Midtrans authoritative status lookup failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Status transaksi belum dapat diverifikasi. Gateway dapat mengirim ulang notifikasi." }, { status: 503 });
  }
  const verifiedAmount = amountInRupiah(verified.gross_amount);
  if (verified.order_id !== order_id || verified.transaction_id !== transaction_id || verifiedAmount !== amount || verified.currency !== "IDR") {
    return NextResponse.json({ error: "Referensi, nominal, atau mata uang transaksi tidak cocok dengan status gateway." }, { status: 409 });
  }
  if (typeof verified.transaction_status !== "string" || typeof verified.status_code !== "string") return NextResponse.json({ error: "Status gateway tidak lengkap." }, { status: 503 });
  const verifiedStatus = verified.transaction_status;
  const verifiedStatusCode = verified.status_code;
  const verifiedGrossAmount = String(verified.gross_amount);
  const eventKey = midtransEventKey(transaction_id, verifiedStatus, verifiedStatusCode, verifiedGrossAmount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { orderCode: order_id }, select: { id: true, orderCode: true, rentalStatus: true, exceptionStatus: true, totalRentalFee: true } });
      if (!rental) return { kind: "missing" as const };
      await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM Rental WHERE id = ${rental.id} FOR UPDATE`;
      await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM Payment WHERE rentalId = ${rental.id} FOR UPDATE`;
      const currentRental = await tx.rental.findUnique({ where: { id: rental.id }, include: { payment: true } });
      if (!currentRental?.payment) return { kind: "missing" as const };
      const payment = currentRental.payment;
      if (amount !== payment.amount || amount !== currentRental.totalRentalFee) return { kind: "amount_mismatch" as const };

      const existingEvent = await tx.paymentGatewayEvent.findUnique({ where: { eventKey } });
      if (existingEvent) return { kind: "duplicate" as const };

      const paid = verifiedStatus === "settlement" || (verifiedStatus === "capture" && verified.fraud_status === "accept");
      const failure = verifiedStatus === "deny" || verifiedStatus === "cancel" || verifiedStatus === "expire";
      const pending = verifiedStatus === "pending" || (verifiedStatus === "capture" && verified.fraud_status !== "accept");
      let nextPaymentStatus = payment.paymentStatus;
      let nextRentalStatus = currentRental.rentalStatus;
      let resultCode = "ignored_stale";

      if (payment.paymentStatus !== "berhasil" && paid) {
        if (currentRental.rentalStatus === "menunggu_pembayaran" && !currentRental.exceptionStatus) {
          nextPaymentStatus = "berhasil";
          nextRentalStatus = "siap_diambil";
          resultCode = "settled";
          await tx.rentalStatusHistory.create({ data: { rentalId: currentRental.id, fromStatus: currentRental.rentalStatus, toStatus: nextRentalStatus, reason: `Pembayaran Midtrans ${transaction_id} terverifikasi.` } });
        } else {
          // Late settlement after expiry/rejection requires a human reconciliation; never resurrect or allocate the order.
          nextPaymentStatus = "perlu_rekonsiliasi";
          resultCode = "reconciliation_required";
        }
      } else if (payment.paymentStatus !== "berhasil" && failure && currentRental.rentalStatus === "menunggu_pembayaran" && !currentRental.exceptionStatus) {
        nextPaymentStatus = verifiedStatus === "expire" ? "kedaluwarsa" : "gagal";
        nextRentalStatus = "kedaluwarsa";
        resultCode = "failed";
        await tx.rentalStatusHistory.create({ data: { rentalId: currentRental.id, fromStatus: currentRental.rentalStatus, toStatus: nextRentalStatus, reason: `Status transaksi Midtrans: ${verifiedStatus}.` } });
      } else if (payment.paymentStatus !== "berhasil" && pending && currentRental.rentalStatus === "menunggu_pembayaran") {
        nextPaymentStatus = "tertunda";
        resultCode = "pending";
      }

      await tx.paymentGatewayEvent.create({ data: { paymentId: payment.id, eventKey, transactionId: transaction_id, transactionStatus: verifiedStatus, statusCode: verifiedStatusCode, grossAmount: verifiedGrossAmount, processingResult: resultCode } });
      await tx.payment.update({ where: { id: payment.id }, data: {
        paymentStatus: nextPaymentStatus,
        paymentMethod: typeof body.payment_type === "string" ? body.payment_type.slice(0, 80) : payment.paymentMethod,
        gatewayTransactionId: transaction_id.slice(0, 120), gatewayStatus: verifiedStatus.slice(0, 40),
        paidAt: nextPaymentStatus === "berhasil" ? (payment.paidAt || new Date()) : payment.paidAt,
      } });
      if (nextRentalStatus !== currentRental.rentalStatus) {
        await tx.rental.update({ where: { id: currentRental.id }, data: { rentalStatus: nextRentalStatus, exceptionStatus: nextRentalStatus === "kedaluwarsa" ? "kedaluwarsa" : null } });
      }
      return { kind: resultCode as "settled" | "reconciliation_required" | "failed" | "pending" | "ignored_stale" };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 });

    if (result.kind === "missing") return NextResponse.json({ error: "Pesanan atau tagihan tidak ditemukan." }, { status: 404 });
    if (result.kind === "amount_mismatch") return NextResponse.json({ error: "Nominal gateway tidak cocok dengan tagihan." }, { status: 409 });
    return NextResponse.json({ message: "Notifikasi diproses.", result: result.kind }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "Notifikasi duplikat telah diproses." }, { status: 200 });
    console.error("Midtrans notification processing failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Notifikasi gateway gagal diproses." }, { status: 500 });
  }
}
