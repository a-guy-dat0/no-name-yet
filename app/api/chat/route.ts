import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chat, ChatMessage } from "@/lib/ollama";
import { getUsage, recordQuestion } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;

  // Check quota BEFORE calling the model.
  const usage = await getUsage(userId);
  if (usage.remaining <= 0) {
    return NextResponse.json(
      {
        error: "Quota reached",
        usage,
        message: `You have used all ${usage.limit} questions for this ${usage.period}. Upgrade or wait until ${usage.resetsAt.toISOString()}.`
      },
      { status: 429 }
    );
  }

  let body: { messages?: ChatMessage[]; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages: ChatMessage[] = body.messages?.length
    ? body.messages
    : body.prompt
    ? [{ role: "user", content: body.prompt }]
    : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages or prompt required" }, { status: 400 });
  }

  // Last user message (for usage log).
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    const answer = await chat(messages);
    await recordQuestion(userId, lastUserMsg, answer);
    const newUsage = await getUsage(userId);
    return NextResponse.json({ answer, usage: newUsage });
  } catch (err: any) {
    console.error("[chat] Ollama error:", err);
    return NextResponse.json(
      { error: "AI backend unavailable", detail: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}
