import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const userId = session.user.id;
  // Cascade deletes conversations, messages, sessions, accounts
  await prisma.user.delete({ where: { id: userId } });
  // Also wipe memory file
  const file = path.join(process.cwd(), "data", "memories", `${userId}.md`);
  await fs.unlink(file).catch(() => {});
  return NextResponse.json({ ok: true });
}
