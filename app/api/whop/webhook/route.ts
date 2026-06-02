// Whop webhook — fires when a membership is created, cancelled, or expires.
// Configure in Whop dashboard → Developer → Webhooks:
//   URL: https://ask-it.ink/api/whop/webhook
//
// Events:
//   membership_activated   → subscription active  → upgrade tier
//   membership_deactivated → cancelled/expired    → downgrade to free

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tierFromWhopPlanId } from "@/lib/tiers";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("whop-signature") ?? req.headers.get("x-whop-signature");

  if (!verifySignature(rawBody, signature)) {
    console.warn("[whop] invalid signature — rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const action: string = body.action ?? "";
  const data = body.data ?? {};

  const email: string = data.user?.email ?? data.email ?? "";
  const planId: string = data.plan_id ?? data.product?.plan_id ?? "";

  console.log(`[whop] action=${action} email=${email} plan=${planId}`);

  if (!email) return NextResponse.json({ ok: true, skipped: "no email" });

  switch (action) {
    case "membership_activated": {
      const tier = tierFromWhopPlanId(planId);
      if (tier === null) {
        console.warn(`[whop] unknown plan: ${planId}`);
        break;
      }
      await prisma.user.updateMany({
        where: { email },
        data: { tier, subscriptionStatus: "ACTIVE" }
      });
      console.log(`[whop] upgraded ${email} to tier ${tier}`);
      break;
    }

    case "membership_deactivated": {
      await prisma.user.updateMany({
        where: { email },
        data: { tier: 0, subscriptionStatus: "CANCELLED" }
      });
      console.log(`[whop] downgraded ${email} to free`);
      break;
    }

    default:
      console.log(`[whop] unhandled action: ${action}`);
  }

  return NextResponse.json({ ok: true });
}
