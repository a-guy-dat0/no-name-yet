// Web search via DuckDuckGo's HTML endpoint — no API key required.
// Used for search injection: results are fetched server-side and pasted
// into the AI's system prompt so it can answer with live web data.

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const SEARCH_TIMEOUT_MS = 8_000;

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x?\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// DDG wraps result links in a redirect: //duckduckgo.com/l/?uddg=<encoded-url>&...
function realUrl(href: string): string {
  const m = href.match(/[?&]uddg=([^&]+)/);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch { /* fall through */ }
  }
  if (href.startsWith("//")) return "https:" + href;
  return href;
}

export async function webSearch(query: string, max = 5): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query),
      {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        }
      }
    );
    if (!res.ok) return [];
    const html = await res.text();

    // Titles + links and snippets appear in document order — zip them by index.
    const links: { url: string; title: string }[] = [];
    const linkRe = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) && links.length < max) {
      links.push({ url: realUrl(m[1]), title: stripTags(m[2]) });
    }

    const snippets: string[] = [];
    const snipRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    while ((m = snipRe.exec(html)) && snippets.length < max) {
      snippets.push(stripTags(m[1]));
    }

    return links.map((l, i) => ({
      title: l.title,
      url: l.url,
      snippet: snippets[i] ?? ""
    })).filter(r => r.title && r.url.startsWith("http"));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
