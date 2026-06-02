// PayPal create-subscription — inactive. Gumroad is now the payment processor.
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json({ ok: true, note: "PayPal not active" });
}
