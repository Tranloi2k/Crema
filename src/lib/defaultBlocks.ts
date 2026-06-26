import type { Block, BlockType, StackBlock } from "@/lib/types";
import { DEFAULT_COMMON_STYLE, DEFAULT_FONT_FAMILY, dim } from "@/lib/types";

export const ROOT_ID = "root";

let counter = 0;
function nextId() {
  counter += 1;
  return `block-${Date.now()}-${counter}`;
}

export function createBlock(type: BlockType): Block {
  const id = nextId();
  switch (type) {
    case "text":
      return {
        id,
        type,
        content: { html: "<p>Edit this text</p>" },
        style: {
          ...DEFAULT_COMMON_STYLE,
          align: "left",
          color: "#1a1a1a",
          fontSize: 16,
          lineHeight: 1.5,
          letterSpacing: 0,
          fontFamily: DEFAULT_FONT_FAMILY,
          fontWeight: 400,
          textTransform: "none",
          textDecoration: "none",
          fontStyle: "normal",
          verticalAlign: "top",
          width: dim(0, "fill"),
          height: dim(0, "fit-content"),
          padding: 12,
        },
      };
    case "image":
      return {
        id,
        type,
        content: { src: "https://placehold.co/560x200", alt: "", href: "" },
        style: {
          ...DEFAULT_COMMON_STYLE,
          width: dim(560),
          height: dim(0, "fit-content"),
          align: "center",
          padding: 12,
        },
      };
    case "button":
      return {
        id,
        type,
        content: { label: "Click me", href: "https://example.com" },
        style: {
          ...DEFAULT_COMMON_STYLE,
          align: "center",
          bgColor: "#111827",
          textColor: "#ffffff",
          borderRadius: 6,
          width: dim(0, "fit-content"),
          height: dim(0, "fit-content"),
          padding: 12,
        },
      };
    case "divider":
      return {
        id,
        type,
        content: {},
        style: { ...DEFAULT_COMMON_STYLE, color: "#e5e7eb", thickness: 1, padding: 12 },
      };
    case "spacer":
      return { id, type, content: {}, style: { ...DEFAULT_COMMON_STYLE, height: dim(24) } };
    case "social":
      // One Social block = one icon. Add several blocks (e.g. inside a row Stack)
      // to build an icon row. Sized via width/height like other blocks.
      return {
        id,
        type,
        content: { platform: "facebook", href: "https://facebook.com" },
        style: {
          ...DEFAULT_COMMON_STYLE,
          align: "center",
          iconColor: "#6b7280",
          width: dim(32),
          height: dim(32),
          padding: 12,
        },
      };
    case "stack":
      return {
        id,
        type,
        content: {},
        style: {
          ...DEFAULT_COMMON_STYLE,
          direction: "column",
          gap: 8,
          padding: 12,
          justify: "start",
          align: "start",
          width: dim(0, "fill"),
          height: dim(0, "fit-content"),
        },
        children: [],
      };
  }
}

// Deep-clones a block (recursively, for Stack children) with fresh ids so
// Duplicate/Paste never share identity with the original.
export function cloneBlockWithNewIds(block: Block): Block {
  const id = nextId();
  if (block.type === "stack") {
    return { ...block, id, children: block.children.map(cloneBlockWithNewIds) };
  }
  return { ...block, id };
}

// The canvas's top level is itself a real, always-present Stack — selectable
// and styleable like any other Stack, just never deletable (fixed id).
export function createRootBlock(): StackBlock {
  return {
    id: ROOT_ID,
    type: "stack",
    name: "Email",
    content: {},
    style: {
      ...DEFAULT_COMMON_STYLE,
      direction: "column",
      gap: 8,
      padding: 12,
      justify: "start",
      align: "start",
      width: dim(600, "px"),
      height: dim(600, "px"),
      bgColor: "#ffffff",
    },
    children: [],
  };
}

// Templates saved before the root-Stack change stored `content` as a bare
// Block[]. Wrap that legacy shape in a fresh root Stack so old templates
// keep loading without a migration script.
export function normalizeRoot(content: unknown): StackBlock {
  if (Array.isArray(content)) {
    return { ...createRootBlock(), children: content as Block[] };
  }
  if (content && typeof content === "object" && (content as { type?: string }).type === "stack") {
    return content as StackBlock;
  }
  return createRootBlock();
}
