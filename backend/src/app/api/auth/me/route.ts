import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Session lookup failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Sesi belum dapat diperiksa. Periksa konfigurasi server." }, { status: 500 });
  }
}
