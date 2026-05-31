// Tier definitions for {no name yet}
// Tier 0: free        — 5 questions / MONTH
// Tier 1: $10 / month — 25 questions / WEEK
// Tier 2: $20 / month — 55 questions / WEEK
// Tier 3: $60 / month — 200 questions / WEEK

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
      "Try {no name yet} with 5 questions per month",
      "Same uncensored model as paid tiers",
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
    priceUsd: 60,
    limit: 200,
    period: "week",
    highlights: [
      "200 questions per week",
      "For power users",
      "Cancel anytime"
    ]
  }
};

export function paypalPlanIdForTier(tier: TierId): string | undefined {
  if (tier === 1) return process.env.PAYPAL_PLAN_ID_TIER1;
  if (tier === 2) return process.env.PAYPAL_PLAN_ID_TIER2;
  if (tier === 3) return process.env.PAYPAL_PLAN_ID_TIER3;
  return undefined;
}

export function tierFromPlanId(planId: string): TierId | null {
  if (planId === process.env.PAYPAL_PLAN_ID_TIER1) return 1;
  if (planId === process.env.PAYPAL_PLAN_ID_TIER2) return 2;
  if (planId === process.env.PAYPAL_PLAN_ID_TIER3) return 3;
  return null;
}
