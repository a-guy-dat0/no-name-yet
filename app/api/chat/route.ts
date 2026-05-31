// Streaming chat route — pipes Ollama tokens straight to the browser so the
// user sees output immediately instead of waiting for the full response.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamChat, ChatMessage } from "@/lib/ollama";
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
        message: `You have used all ${usage.limit} questions for this ${usage.period}.`
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

  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // Start the Ollama stream — if Ollama is unreachable this throws immediately.
  let ollamaStream: ReadableStream<Uint8Array>;
  try {
    ollamaStream = await streamChat(messages);
  } catch (err: any) {
    console.error("[chat] Ollama error:", err);
    return NextResponse.json(
      { error: "AI backend unavailable", detail: String(err?.message ?? err) },
      { status: 502 }
    );
  }

  // Accumulate the full answer while streaming tokens to the browser.
  let fullAnswer = "";
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaStream.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullAnswer += chunk;
          controller.enqueue(value);
        }
      } catch (err) {
        console.error("[chat] stream error:", err);
      } finally {
        controller.close();
        // Fire-and-forget: record after stream ends so the DB write
        // doesn't delay the last token reaching the browser.
        recordQuestion(userId, lastUserMsg, fullAnswer).catch(console.error);
      }
    },
    cancel() {
      // Client disconnected — still record whatever arrived.
      recordQuestion(userId, lastUserMsg, fullAnswer).catch(console.error);
    }
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Tell the browser this is a stream — don't buffer it.
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    }
  });
}
