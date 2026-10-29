import Link from "next/link";

import { parseInline, parseMarkdown, type InlineToken } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function Inline({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === "strong") {
          return <strong key={index}>{token.text}</strong>;
        }
        if (token.type === "em") {
          return <em key={index}>{token.text}</em>;
        }
        if (token.type === "link") {
          if (token.href.startsWith("/")) {
            return (
              <Link key={index} href={token.href}>
                {token.text}
              </Link>
            );
          }
          return (
            <a key={index} href={token.href} target="_blank" rel="noopener noreferrer">
              {token.text}
            </a>
          );
        }
        return <span key={index}>{token.text}</span>;
      })}
    </>
  );
}

export function ArticleBody({ content, className }: { content: string; className?: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className={cn("prose-giwesa", className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return block.level === 2 ? (
            <h2 key={index}>
              <Inline tokens={parseInline(block.text)} />
            </h2>
          ) : (
            <h3 key={index}>
              <Inline tokens={parseInline(block.text)} />
            </h3>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index}>
              <Inline tokens={parseInline(block.text)} />
            </blockquote>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline tokens={parseInline(item)} />
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={index}>
            <Inline tokens={parseInline(block.text)} />
          </p>
        );
      })}
    </div>
  );
}
