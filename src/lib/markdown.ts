export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string };

const blockStart = /^(#{2,3}\s|[-*]\s|\d+[.)]\s|>\s)/;

/**
 * Deliberately small Markdown subset for editor-authored articles.
 *
 * Raw HTML is never accepted or rendered: the parser returns structured React
 * elements, so a post cannot inject scripts even if an editor pastes HTML. Links
 * are validated separately by the renderer.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      index += 1;
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\d+[.)]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("> ")) {
        quoteLines.push((lines[index] ?? "").slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    const paragraphLines: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !blockStart.test(lines[index] ?? "")
    ) {
      paragraphLines.push((lines[index] ?? "").trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export type InlineToken =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "link"; text: string; href: string };

export function safeLinkHref(raw: string): string | null {
  const href = raw.trim();
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  try {
    const url = new URL(href);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", text: source.slice(cursor, match.index) });
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      const href = safeLinkHref(match[2]);
      tokens.push(href ? { type: "link", text: match[1], href } : { type: "text", text: match[1] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: "strong", text: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: "em", text: match[4] });
    }
    cursor = pattern.lastIndex;
  }

  if (cursor < source.length) {
    tokens.push({ type: "text", text: source.slice(cursor) });
  }
  return tokens;
}

export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .map((block) => {
      if (block.type === "list") {
        return block.items.map((item) => inlineToPlainText(item)).join(" ");
      }
      return inlineToPlainText(block.text);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineToPlainText(source: string): string {
  return parseInline(source)
    .map((token) => token.text)
    .join("");
}

export function readingTimeMinutes(source: string): number {
  const words = markdownToPlainText(source).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
