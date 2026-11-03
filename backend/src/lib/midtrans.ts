import { createHash, timingSafeEqual } from "node:crypto";

const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SNAP_URLS = {
  sandbox: {
    api: "https://app.sandbox.midtrans.com/snap/v1/transactions",
    statusApi: "https://api.sandbox.midtrans.com/v2",
    javascript: "https://app.sandbox.midtrans.com/snap/snap.js",
    checkout: "https://app.sandbox.midtrans.com/snap/v2/vtweb/",
    serverPrefix: "SB-Mid-server-",
    clientPrefix: "SB-Mid-client-",
  },
  production: {
    api: "https://app.midtrans.com/snap/v1/transactions",
    statusApi: "https://api.midtrans.com/v2",
    javascript: "https://app.midtrans.com/snap/snap.js",
    checkout: "https://app.midtrans.com/snap/v2/vtweb/",
    serverPrefix: "Mid-server-",
    clientPrefix: "Mid-client-",
  },
} as const;

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: { first_name: string; email: string; phone: string };
  itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>;
}

export function getMidtransPublicConfig() {
  const mode = MIDTRANS_IS_PRODUCTION ? SNAP_URLS.production : SNAP_URLS.sandbox;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  if (process.env.NODE_ENV === "production" && !MIDTRANS_IS_PRODUCTION) {
    throw new Error("Pembayaran produksi memerlukan MIDTRANS_IS_PRODUCTION=true.");
  }
  if (process.env.NODE_ENV !== "production" && MIDTRANS_IS_PRODUCTION) {
    throw new Error("Mode pembayaran live hanya dapat dipakai pada deployment production.");
  }
  if (!clientKey.startsWith(mode.clientPrefix) || !serverKey.startsWith(mode.serverPrefix)) {
    throw new Error(`MIDTRANS_CLIENT_KEY dan MIDTRANS_SERVER_KEY harus diisi dengan pasangan kunci ${MIDTRANS_IS_PRODUCTION ? "production" : "sandbox"} yang benar.`);
  }
  return { clientKey, snapJavascriptUrl: mode.javascript };
}

function getServerConfig() {
  const publicConfig = getMidtransPublicConfig();
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const urls = MIDTRANS_IS_PRODUCTION ? SNAP_URLS.production : SNAP_URLS.sandbox;
  return { serverKey, apiUrl: urls.api, statusApiUrl: urls.statusApi, checkoutUrl: urls.checkout, ...publicConfig };
}

export async function getMidtransTransactionStatus(orderId: string): Promise<Record<string, unknown>> {
  const config = getServerConfig();
  const authorization = Buffer.from(`${config.serverKey}:`).toString("base64");
  const response = await fetch(`${config.statusApiUrl}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: `Basic ${authorization}` }, cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") throw new Error(`Midtrans status verification failed (${response.status}).`);
  return data as Record<string, unknown>;
}

export async function createMidtransSnapToken(params: CreateSnapTransactionParams) {
  const config = getServerConfig();
  const authString = Buffer.from(`${config.serverKey}:`).toString("base64");
  const payload = {
    transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
    credit_card: { secure: true },
  };

  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Basic ${authString}` },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new Error("Gateway pembayaran tidak dapat dihubungi. Coba lagi beberapa saat.");
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string" || !("redirect_url" in data) || typeof data.redirect_url !== "string") {
    throw new Error(`Gateway pembayaran gagal membuat transaksi (HTTP ${response.status}). Silakan coba lagi atau hubungi Admin.`);
  }

  const expectedCheckoutPrefix = config.checkoutUrl;
  if (!data.redirect_url.startsWith(expectedCheckoutPrefix)) throw new Error("Gateway mengembalikan alamat pembayaran yang tidak valid.");
  return { token: data.token, redirect_url: data.redirect_url };
}

export function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  if (!serverKey || typeof signatureKey !== "string" || !/^[a-f0-9]{128}$/i.test(signatureKey)) return false;
  const expected = createHash("sha512").update(orderId + statusCode + grossAmount + serverKey).digest();
  const supplied = Buffer.from(signatureKey, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

export function midtransEventKey(transactionId: string, transactionStatus: string, statusCode: string, grossAmount: string): string {
  return createHash("sha256").update(`${transactionId}|${transactionStatus}|${statusCode}|${grossAmount}`).digest("hex");
}
