// Thin client for the local Ollama HTTP API.
// Docs: https://github.com/ollama/ollama/blob/main/docs/api.md

const BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "hf.co/Jiunsong/supergemma4-26b-uncensored-gguf-v2";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Streams a chat completion from Ollama as Server-Sent Events-ish JSON lines.
 * Returns a ReadableStream of UTF-8 text chunks, suitable for piping straight
 * back to the browser.
 */
export async function streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const upstream = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: true })
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`Ollama error ${upstream.status}: ${text}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
          const piece: string = json?.message?.content ?? "";
          if (piece) controller.enqueue(encoder.encode(piece));
        } catch {
          // Ignore parse errors on partial lines.
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    }
  });
}

/**
 * Non-streaming convenience wrapper — collects the whole response into a string.
 * Used by the chat route so we can store the full answer in the database after
 * the stream finishes.
 */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const upstream = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false })
  });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`Ollama error ${upstream.status}: ${text}`);
  }
  const json = await upstream.json();
  return json?.message?.content ?? "";
}
