import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { clearLoginFailures, loginRetryAfter, recordLoginFailure } from "@/lib/loginRateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length > 128) {
      return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
    }

    const retryAfter = loginRetryAfter(req, email);
    if (retryAfter) return NextResponse.json({ error: "Terlalu banyak percobaan login. Coba lagi beberapa menit." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = Boolean(user?.isActive && await verifyPassword(password, user.password));
    if (!user || !valid) {
      recordLoginFailure(req, email);
      return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
    }

    clearLoginFailures(req, email);
    await setSessionCookie(user.id);
    return NextResponse.json({
      message: "Login berhasil.",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Login request failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Login belum dapat diproses. Periksa konfigurasi server." }, { status: 500 });
  }
}


