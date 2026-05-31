import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paypalFetch } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.paypalSubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }
  try {
    await paypalFetch(`/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: "User requested cancellation" })
    });
  } catch (err: any) {
    return NextResponse.json({ error: "PayPal cancel failed", detail: String(err) }, { status: 502 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "CANCELLED", tier: 0 }
  });
  return NextResponse.json({ ok: true });
}
