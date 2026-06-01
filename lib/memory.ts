// Per-user memory files — stored at data/memories/{userId}.md
// The AI reads this at the start of every conversation so it remembers
// topics and context from previous sessions.

import { promises as fs } from "fs";
import path from "path";

const MEMORY_DIR = path.join(process.cwd(), "data", "memories");
const MAX_ENTRIES = 30; // keep last 30 questions — enough context without bloating the prompt

export async function getUserMemory(userId: string): Promise<string> {
  const file = path.join(MEMORY_DIR, `${userId}.md`);
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return ""; // no memory file yet — first session
  }
}

export async function appendToMemory(userId: string, question: string): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  const file = path.join(MEMORY_DIR, `${userId}.md`);

  let existing = "";
  try { existing = await fs.readFile(file, "utf-8"); } catch {}

  const date = new Date().toISOString().replace("T", " ").slice(0, 16);
  const entry = `- [${date}] ${question.replace(/\n/g, " ").slice(0, 200)}`;

  const lines = existing.split("\n").filter(Boolean);
  lines.push(entry);

  // Trim oldest entries so the file doesn't grow unbounded
  const kept = lines.slice(-MAX_ENTRIES);
  await fs.writeFile(file, kept.join("\n") + "\n", "utf-8");
}
