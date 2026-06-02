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

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const action: string = body.action ?? "";
  const data = body.data ?? {};

  // Whop sends the user's email inside the membership object
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
