import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (name.length < 2 || name.length > 100 || phone.length < 6 || phone.length > 24 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Periksa kembali nama, email, dan nomor telepon Anda." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Kata sandi harus terdiri dari 8 sampai 128 karakter." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Konfirmasi kata sandi belum sama." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

    const user = await prisma.user.create({
      data: { name, email, phone, password: await hashPassword(password), role: "penyewa", isActive: true },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ message: "Pendaftaran berhasil.", user }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    console.error("Registration request failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Pendaftaran belum dapat diproses. Periksa konfigurasi server." }, { status: 500 });
  }
}
