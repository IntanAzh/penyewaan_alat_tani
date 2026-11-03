type AttemptWindow = { count: number; resetAt: number };
const attempts = new Map<string, AttemptWindow>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function keyFor(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("x-real-ip")?.trim() || forwarded || "local";
  return `${email.toLowerCase()}|${address}`;
}

export function loginRetryAfter(request: Request, email: string): number | null {
  const now = Date.now();
  for (const [key, window] of attempts) if (window.resetAt <= now) attempts.delete(key);
  const window = attempts.get(keyFor(request, email));
  if (!window || window.count < MAX_ATTEMPTS) return null;
  return Math.max(1, Math.ceil((window.resetAt - now) / 1000));
}

export function recordLoginFailure(request: Request, email: string) {
  const now = Date.now();
  const key = keyFor(request, email);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function clearLoginFailures(request: Request, email: string) {
  attempts.delete(keyFor(request, email));
}
