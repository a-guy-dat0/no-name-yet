// Fetches a web page and returns its readable text — used to give the AI
// "internet access": when a user pastes a URL in their message, we pull the
// page content server-side and inject it into the prompt as context.
//
// SSRF protection: blocks localhost/private IPs so users can't make the
// server fetch internal services (e.g. the Ollama port on 127.0.0.1).

import { lookup } from "dns/promises";
import { isIP } from "net";

const MAX_PAGE_CHARS = 2500;   // per page — keeps prefill fast on the CPU model
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (ip === "0.0.0.0") return true;
  const low = ip.toLowerCase();
  if (low === "::1" || low.startsWith("fe80:") || low.startsWith("fc") || low.startsWith("fd")) return true;
  return false;
}

async function isBlockedHost(hostname: string): Promise<boolean> {
  if (hostname === "localhost") return true;
  if (isIP(hostname)) return isPrivateIp(hostname);
  try {
    const addrs = await lookup(hostname, { all: true });
    return addrs.some(a => isPrivateIp(a.address));
  } catch {
    return true; // can't resolve — don't fetch
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPageText(rawUrl: string): Promise<string | null> {
  let current: URL;
  try { current = new URL(rawUrl); } catch { return null; }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") return null;
    if (await isBlockedHost(current.hostname)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual", // re-check SSRF on every hop
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ask-it-bot/1.0)" }
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    // Follow redirects manually so each destination is SSRF-checked
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      try { current = new URL(loc, current); } catch { return null; }
      continue;
    }

    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/json/.test(ct)) return null;

    let bodyText = await res.text();
    if (bodyText.length > 500_000) bodyText = bodyText.slice(0, 500_000);
    const text = ct.includes("text/html") ? htmlToText(bodyText) : bodyText.replace(/\s+/g, " ").trim();
    return text.slice(0, MAX_PAGE_CHARS) || null;
  }
  return null;
}

// Extracts up to `max` URLs from a message.
export function extractUrls(text: string, max = 2): string[] {
  const matches = text.match(/https?:\/\/[^\s)>"'\]]+/g) ?? [];
  return [...new Set(matches)].slice(0, max);
}
