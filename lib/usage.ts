import { prisma } from "./db";
import { TIERS, TierId } from "./tiers";

/**
 * Returns the timestamp at the start of the user's current usage period.
 * - "week" = last 7 days
 * - "month" = last 30 days
 * We use rolling windows rather than calendar weeks/months so a user who
 * upgrades mid-week immediately gets their full allowance.
 */
function periodStart(period: "week" | "month"): Date {
  const ms = period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

export interface UsageSummary {
  tier: TierId;
  limit: number;
  period: "week" | "month";
  used: number;
  remaining: number;
  resetsAt: Date;
}

export async function getUsage(userId: string): Promise<UsageSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.tier ?? 0) as TierId;
  const def = TIERS[tier];
  const since = periodStart(def.period);
  const used = await prisma.question.count({
    where: { userId, createdAt: { gte: since } }
  });
  const resetMs = def.period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return {
    tier,
    limit: def.limit,
    period: def.period,
    used,
    remaining: Math.max(0, def.limit - used),
    resetsAt: new Date(since.getTime() + resetMs)
  };
}

export async function recordQuestion(userId: string, prompt: string, answer: string) {
  await prisma.question.create({ data: { userId, prompt, answer } });
}
