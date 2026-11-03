import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "tanisewa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export type UserRole = "admin" | "penyewa";
export type SessionUser = { id: string; name: string; email: string; phone: string; role: UserRole };

type SessionPayload = { sub: string; exp: number };

type AuthGlobal = typeof globalThis & { __tanisewaDevSessionSecret?: string };
const authGlobal = globalThis as AuthGlobal;

function sessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && Buffer.byteLength(configured, "utf8") >= 32) return configured;
  if (process.env.NODE_ENV !== "production") {
    authGlobal.__tanisewaDevSessionSecret ??= randomBytes(32).toString("base64url");
    return authGlobal.__tanisewaDevSessionSecret;
  }
  throw new Error("SESSION_SECRET harus diisi dengan minimal 32 byte acak.");
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = { sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, suppliedSignature] = parts;
  const expectedSignature = Buffer.from(sign(encoded), "base64url");
  const actualSignature = Buffer.from(suppliedSignature, "base64url");
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.sub !== "string" || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!user || !user.isActive || (user.role !== "admin" && user.role !== "penyewa")) return null;
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

export async function requireSessionUser(role?: UserRole): Promise<{ user: SessionUser | null; response: NextResponse | null }> {
  const user = await getSessionUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali." }, { status: 401 }) };
  if (role && user.role !== role) return { user: null, response: NextResponse.json({ error: "Anda tidak memiliki izin untuk melakukan tindakan ini." }, { status: 403 }) };
  return { user, response: null };
}

