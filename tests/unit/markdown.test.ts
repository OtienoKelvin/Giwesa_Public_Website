import { describe, expect, it } from "vitest";

import {
  markdownToPlainText,
  parseInline,
  parseMarkdown,
  readingTimeMinutes,
  safeLinkHref,
} from "@/lib/markdown";

describe("markdown parser", () => {
  it("parses headings, paragraphs, lists and quotes", () => {
    const blocks = parseMarkdown(
      "## A heading\n\nA paragraph with **bold** text.\n\n- One\n- Two\n\n> A quote",
    );
    expect(blocks[0]).toEqual({ type: "heading", level: 2, text: "A heading" });
    expect(blocks[1]).toEqual({ type: "paragraph", text: "A paragraph with **bold** text." });
    expect(blocks[2]).toEqual({ type: "list", ordered: false, items: ["One", "Two"] });
    expect(blocks[3]).toEqual({ type: "quote", text: "A quote" });
  });

  it("does not turn raw HTML into a renderable block", () => {
    const blocks = parseMarkdown('<script>alert("xss")</script>');
    expect(blocks[0]).toEqual({
      type: "paragraph",
      text: '<script>alert("xss")</script>',
    });
  });

  it("supports safe links and rejects script URLs", () => {
    expect(safeLinkHref("https://example.com")).toBe("https://example.com/");
    expect(safeLinkHref("/contact")).toBe("/contact");
    expect(safeLinkHref("javascript:alert(1)")).toBeNull();
    expect(safeLinkHref("//example.com")).toBeNull();

    const tokens = parseInline("Read [this](https://example.com) and [bad](javascript:alert(1))");
    expect(tokens.some((token) => token.type === "link" && token.text === "this")).toBe(true);
    expect(tokens.some((token) => token.type === "link" && token.text === "bad")).toBe(false);
  });

  it("calculates a useful plain-text summary and reading time", () => {
    expect(markdownToPlainText("## Heading\n\nSome **content**.")).toBe("Heading Some content.");
    expect(readingTimeMinutes("word ".repeat(401))).toBe(3);
  });
});
