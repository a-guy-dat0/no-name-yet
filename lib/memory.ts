// Per-user memory files — stored at data/memories/{userId}.md
// Each entry is tagged with the conversation ID so we can surgically
// remove entries when a conversation is deleted.
// Format: - [date] [convId:xxx] question text

import { promises as fs } from "fs";
import path from "path";

const MEMORY_DIR = path.join(process.cwd(), "data", "memories");
const MAX_ENTRIES = 30;

export async function getUserMemory(userId: string): Promise<string> {
  const file = path.join(MEMORY_DIR, `${userId}.md`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    // Strip the convId tags before sending to the AI — it only needs the text
    return raw
      .split("\n")
      .filter(Boolean)
      .map(l => l.replace(/\s*\[convId:[^\]]+\]/, ""))
      .join("\n");
  } catch {
    return "";
  }
}

export async function appendToMemory(
  userId: string,
  question: string,
  convId: string
): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  const file = path.join(MEMORY_DIR, `${userId}.md`);

  let existing = "";
  try { existing = await fs.readFile(file, "utf-8"); } catch {}

  const date = new Date().toISOString().replace("T", " ").slice(0, 16);
  const entry = `- [${date}] [convId:${convId}] ${question.replace(/\n/g, " ").slice(0, 200)}`;

  const lines = existing.split("\n").filter(Boolean);
  lines.push(entry);
  const kept = lines.slice(-MAX_ENTRIES);
  await fs.writeFile(file, kept.join("\n") + "\n", "utf-8");
}

export async function clearConversationMemory(
  userId: string,
  convId: string
): Promise<void> {
  const file = path.join(MEMORY_DIR, `${userId}.md`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const filtered = raw
      .split("\n")
      .filter(l => l.trim() && !l.includes(`[convId:${convId}]`))
      .join("\n");
    await fs.writeFile(file, filtered ? filtered + "\n" : "", "utf-8");
  } catch {
    // File doesn't exist — nothing to clear
  }
}
