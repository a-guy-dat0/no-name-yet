import { prisma } from "./db";
import { TIERS, TierId } from "./tiers";

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
  const periodMs = def.period === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  // Fetch questions in the current rolling window
  const questions = await prisma.question.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true }
  });

  const used = questions.length;

  // resetsAt = when the OLDEST question in the window ages out.
  // If no questions yet, show periodMs from now (first question would start the clock).
  const oldestInWindow = questions[0]?.createdAt;
  const resetsAt = oldestInWindow
    ? new Date(oldestInWindow.getTime() + periodMs)
    : new Date(Date.now() + periodMs);

  return {
    tier,
    limit: def.limit,
    period: def.period,
    used,
    remaining: Math.max(0, def.limit - used),
    resetsAt
  };
}

export async function recordQuestion(userId: string, prompt: string, answer: string) {
  await prisma.question.create({ data: { userId, prompt, answer } });
}
