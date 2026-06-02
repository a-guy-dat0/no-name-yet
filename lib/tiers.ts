// Tier definitions for {ask-it}
// Tier 0: free        — 5 questions / MONTH
// Tier 1: $10 / month — 25 questions / WEEK
// Tier 2: $20 / month — 55 questions / WEEK
// Tier 3: $50 / month — 200 questions / WEEK

export type TierId = 0 | 1 | 2 | 3;
export type Period = "week" | "month";

export interface Tier {
  id: TierId;
  name: string;
  priceUsd: number;
  limit: number;
  period: Period;
  highlights: string[];
}

export const TIERS: Record<TierId, Tier> = {
  0: {
    id: 0,
    name: "Free",
    priceUsd: 0,
    limit: 5,
    period: "month",
    highlights: [
      "Try {ask-it} with 5 questions per month",
      "Same powerful AI as paid tiers",
      "No credit card required"
    ]
  },
  1: {
    id: 1,
    name: "Tier 1",
    priceUsd: 10,
    limit: 25,
    period: "week",
    highlights: [
      "25 questions per week",
      "Cancel anytime",
      "Priority over free users"
    ]
  },
  2: {
    id: 2,
    name: "Tier 2",
    priceUsd: 20,
    limit: 55,
    period: "week",
    highlights: [
      "55 questions per week",
      "Best value for regular use",
      "Cancel anytime"
    ]
  },
  3: {
    id: 3,
    name: "Tier 3",
    priceUsd: 50,
    limit: 200,
    period: "week",
    highlights: [
      "200 questions per week",
      "For power users",
      "Cancel anytime"
    ]
  }
};

// Whop checkout URLs — used by the checkout page to redirect to the right plan.
export const WHOP_URLS: Record<TierId, string | undefined> = {
  0: undefined,
  1: "https://whop.com/checkout/plan_0vHjcPuSzIzaA",
  2: "https://whop.com/checkout/plan_tZ3eUDxENOugw",
  3: "https://whop.com/checkout/plan_JuTFnlenCBaja",
};

export function tierFromWhopPlanId(planId: string): TierId | null {
  if (planId === "plan_0vHjcPuSzIzaA") return 1;
  if (planId === "plan_tZ3eUDxENOugw") return 2;
  if (planId === "plan_JuTFnlenCBaja") return 3;
  return null;
}
