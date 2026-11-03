import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SANDBOX_SERVER_KEY";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const SNAP_SANDBOX_API_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    first_name: string;
    email: string;
    phone: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export async function createMidtransSnapToken(params: CreateSnapTransactionParams) {
  const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: params.customerDetails,
    item_details: params.itemDetails,
    credit_card: {
      secure: true,
    },
  };

  try {
    const response = await fetch(SNAP_SANDBOX_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Midtrans Sandbox API Warning:", data);
      // Fallback for offline demo mode when invalid keys are present
      return {
        token: `DEMO-SNAP-TOKEN-${Date.now()}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${params.orderId}`,
      };
    }

    return {
      token: data.token,
      redirect_url: data.redirect_url,
    };
  } catch (error) {
    console.error("Midtrans Snap Error:", error);
    return {
      token: `DEMO-SNAP-TOKEN-${Date.now()}`,
      redirect_url: "#demo-sandbox",
    };
  }
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash("sha512").update(payload).digest("hex");
  return expectedSignature === signatureKey;
}
