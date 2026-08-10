import type { Block, StackBlock } from "@/lib/types";
import { getSocialItems, SOCIAL_PLATFORMS } from "@/lib/social";

// Decode the small set of HTML entities the editor emits (escapeHtml in toHtml.ts
// plus &nbsp;) so the plain-text alternative reads naturally.
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Turn a Text block's stored HTML into readable plain text: list items become
// "- item" lines, links become "text (href)", and block/line breaks become
// newlines. Everything else is stripped.
function htmlToText(html: string): string {
  let out = html;
  // Links: keep the visible text and append the destination in parentheses.
  out = out.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const url = decodeEntities(href).trim();
      if (!url) return text;
      return text && text !== url ? `${text} (${url})` : url;
    }
  );
  // List items → dashed lines.
  out = out.replace(/<li\b[^>]*>/gi, "\n- ").replace(/<\/li>/gi, "");
  // Paragraph / break / heading boundaries → newlines.
  out = out.replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, "\n");
  out = out.replace(/<br\s*\/?>/gi, "\n");
  // Drop every remaining tag.
  out = out.replace(/<[^>]+>/g, "");
  out = decodeEntities(out);
  // Collapse runs of blank lines and trim trailing spaces per line.
  return out
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blockToText(block: Block): string {
  switch (block.type) {
    case "text":
      return htmlToText(block.content.html);
    case "button": {
      const label = block.content.label?.trim() ?? "";
      const href = block.content.href?.trim() ?? "";
      if (label && href) return `${label}: ${href}`;
      return label || href;
    }
    case "image": {
      const alt = block.content.alt?.trim();
      const href = block.content.href?.trim();
      const label = alt ? `[Image: ${alt}]` : "[Image]";
      return href ? `${label} (${href})` : label;
    }
    case "divider":
      return "----------------------------------------";
    case "spacer":
      return "";
    case "social":
      return getSocialItems(block.content)
        .map((item) => `${SOCIAL_PLATFORMS[item.platform].label}: ${item.href.trim()}`)
        .join("\n");
    case "stack":
      return block.children
        .map(blockToText)
        .filter((t) => t.length > 0)
        .join("\n\n");
  }
}

/**
 * Generates a plain-text alternative of an email, for use as the text/plain part
 * of a multipart message (better deliverability, accessible fallback). Walks the
 * block tree in document order and renders each block as readable text.
 */
export function blocksToPlainText(root: StackBlock): string {
  return root.children
    .map(blockToText)
    .filter((t) => t.length > 0)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
