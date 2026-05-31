// Records a newly approved PayPal subscription against the signed-in user.
// The actual subscription is created in the browser via the PayPal JS SDK;
// after the user approves it, the SDK gives us the subscriptionID, and we POST
// it here so the server can verify and store it.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSubscription } from "@/lib/paypal";
import { tierFromPlanId } from "@/lib/tiers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { subscriptionId } = (await req.json().catch(() => ({}))) as {
    subscriptionId?: string;
  };
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  let sub: any;
  try {
    sub = await getSubscription(subscriptionId);
  } catch (err: any) {
    return NextResponse.json({ error: "PayPal lookup failed", detail: String(err) }, { status: 502 });
  }

  const planId: string | undefined = sub.plan_id;
  const tier = planId ? tierFromPlanId(planId) : null;
  if (!planId || tier === null) {
    return NextResponse.json({ error: "Unknown plan", planId }, { status: 400 });
  }
  if (sub.status !== "ACTIVE" && sub.status !== "APPROVAL_PENDING" && sub.status !== "APPROVED") {
    return NextResponse.json({ error: `Subscription is ${sub.status}` }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      tier,
      paypalSubscriptionId: subscriptionId,
      subscriptionStatus: sub.status,
      subscriptionRenewsAt: sub.billing_info?.next_billing_time
        ? new Date(sub.billing_info.next_billing_time)
        : null
    }
  });

  return NextResponse.json({ ok: true, tier });
}
