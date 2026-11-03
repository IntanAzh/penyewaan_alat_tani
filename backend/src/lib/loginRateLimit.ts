import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function clientAddress(request: Request): string {
  const trustedHops = Number(process.env.TRUSTED_PROXY_HOPS || 0);
  if (!Number.isSafeInteger(trustedHops) || trustedHops < 1) return "proxy-unconfigured";

  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "proxy-address-unavailable";
  const addresses = forwarded.split(",").map((value) => value.trim()).filter(Boolean);
  if (!addresses.length) return "proxy-address-unavailable";
  const clientIndex = Math.max(0, addresses.length - trustedHops - 1);
  return addresses[clientIndex].slice(0, 128);
}

function keyFor(request: Request, email: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}|${clientAddress(request)}`).digest("hex");
}

/** Atomically consumes one attempt from a database-backed shared bucket. */
export async function consumeLoginAttempt(request: Request, email: string): Promise<number | null> {
  const key = keyFor(request, email);
  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + WINDOW_MS);

  return prisma.$transaction(async (tx) => {
    await tx.loginRateBucket.upsert({ where: { key }, create: { key, attempts: 0, windowEndsAt }, update: {} });
    await tx.$queryRaw<Array<{ key: string }>>`SELECT \`key\` FROM LoginRateBucket WHERE \`key\` = ${key} FOR UPDATE`;
    const bucket = await tx.loginRateBucket.findUnique({ where: { key } });
    if (!bucket) throw new Error("Login rate limit bucket disappeared.");

    if (bucket.windowEndsAt.getTime() <= now.getTime()) {
      await tx.loginRateBucket.update({ where: { key }, data: { attempts: 1, windowEndsAt } });
      return null;
    }
    if (bucket.attempts >= MAX_ATTEMPTS) return Math.max(1, Math.ceil((bucket.windowEndsAt.getTime() - now.getTime()) / 1000));
    await tx.loginRateBucket.update({ where: { key }, data: { attempts: { increment: 1 } } });
    return null;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 5_000 });
}

export async function clearLoginFailures(request: Request, email: string): Promise<void> {
  await prisma.loginRateBucket.deleteMany({ where: { key: keyFor(request, email) } });
}
