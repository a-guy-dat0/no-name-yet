import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const file = path.join(process.cwd(), "data", "memories", `${session.user.id}.md`);
  await fs.writeFile(file, "", "utf-8").catch(() => {});
  return NextResponse.json({ ok: true });
}
