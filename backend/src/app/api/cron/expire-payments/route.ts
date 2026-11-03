import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireOverduePayments } from "@/lib/paymentExpiry";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const supplied = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const providedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (secret.length < 32 || providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  try {
    const expiredCount = await expireOverduePayments();
    return NextResponse.json({ expiredCount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment expiry job failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Pembersihan pembayaran gagal." }, { status: 500 });
  }
}
