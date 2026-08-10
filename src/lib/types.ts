export type BlockType =
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "stack"
  | "social";

export interface BaseBlock {
  id: string;
  type: BlockType;
  // User-editable label shown in the Layers panel; when undefined the panel
  // falls back to a per-type heuristic (truncated text, button label, etc.).
  name?: string;
  /** Editor-only: keep width/height proportional while resizing. */
  lockAspectRatio?: boolean;
  /** width ÷ height in px, captured when the lock is enabled. */
  aspectRatio?: number;
}

export type Unit = "px" | "%" | "fit-content" | "fill";
export const UNIT_OPTIONS: { label: string; value: Unit }[] = [
  { label: "Pixels", value: "px" },
  { label: "Percent", value: "%" },
  { label: "Auto (content)", value: "fit-content" },
  { label: "Fill container", value: "fill" },
];

/** Framer-style labels for height (and width) size fields. */
export const SIZE_UNIT_OPTIONS: { label: string; shortLabel?: string; value: Unit }[] = [
  { label: "Fixed size", shortLabel: "Fixed", value: "px" },
  { label: "Percent of container", shortLabel: "%", value: "%" },
  { label: "Fill available space", shortLabel: "Fill", value: "fill" },
  { label: "Auto (fit content)", shortLabel: "Auto", value: "fit-content" },
];

export interface Dimension {
  value: number;
  unit: Unit;
}

export function dim(value: number, unit: Unit = "px"): Dimension {
  return { value, unit };
}

// Accepts the current Dimension shape or a legacy plain number (older saved
// templates stored width/height/offsets as bare numbers) and normalizes both
// to a Dimension so render code never has to branch on the old shape.
export function toDimension(v: number | Dimension | undefined, fallback: Dimension): Dimension {
  if (v === undefined) return fallback;
  if (typeof v === "number") return { value: v, unit: "px" };
  return v;
}

// `fit-content` and `fill` are content-driven units — the numeric value is
// preserved in the struct (so toggling back to px/% restores it) but ignored
// at render time. CSS keyword `auto` is the closest match for fit-content;
// `100%` works for fill across canvas, preview, and email clients.
export function dimToCss(d: Dimension): string {
  if (d.unit === "fit-content") return "auto";
  if (d.unit === "fill") return "100%";
  return `${d.value}${d.unit}`;
}

// Four-sided value (padding, etc.). `linked` is a UI hint: when true the
// editor keeps all four values in sync as the user types in any one of them.
export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
  linked: boolean;
}

export function sides(value: number, linked = true): Sides {
  return { top: value, right: value, bottom: value, left: value, linked };
}

// Templates saved before Sides existed stored `padding` as a bare number;
// wrap it so render code can always treat padding as Sides.
export function toSides(v: number | Sides | undefined, fallback = 0): Sides {
  if (v === undefined) return sides(fallback);
  if (typeof v === "number") return sides(v);
  return v;
}

export function sidesToCss(s: Sides): string {
  return `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`;
}

// Border-radius per corner. `linked` syncs all four when editing any one field.
export interface Corners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  linked: boolean;
}

export function corners(value: number, linked = true): Corners {
  return { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value, linked };
}

export function toCorners(v: number | Corners | undefined | null, fallback = 0): Corners {
  if (v === undefined || v === null) return corners(fallback);
  if (typeof v === "number") return corners(Number.isFinite(v) ? v : fallback);
  if (typeof v === "object") {
    return {
      topLeft: Math.max(0, Number(v.topLeft) || 0),
      topRight: Math.max(0, Number(v.topRight) || 0),
      bottomRight: Math.max(0, Number(v.bottomRight) || 0),
      bottomLeft: Math.max(0, Number(v.bottomLeft) || 0),
      linked: v.linked ?? true,
    };
  }
  return corners(fallback);
}

export function cornersToCss(c: Corners): string | undefined {
  const { topLeft, topRight, bottomRight, bottomLeft } = c;
  const allZero = topLeft === 0 && topRight === 0 && bottomRight === 0 && bottomLeft === 0;
  if (allZero) return undefined;
  if (c.linked || (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft)) {
    return `${topLeft}px`;
  }
  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

export type FlexAlign = "start" | "center" | "end";
export type FlexJustify = FlexAlign | "between" | "evenly";

export interface CommonStyle {
  bgColor: string; // "" = no background
  border: { width: number; color: string; style: "solid" | "dashed" | "dotted"; radius: number | Corners };
  position: "static" | "relative" | "absolute";
  // Strictly Dimension in the type system; legacy saved templates may still
  // have plain numbers at runtime, so callers reading raw stored JSON cast
  // through `as Partial<CommonStyle>` and rely on withCommonDefaults/
  // toDimension to normalize before use.
  top: Dimension;
  left: Dimension;
  right: Dimension;
  bottom: Dimension;
}

export const DEFAULT_COMMON_STYLE: CommonStyle = {
  bgColor: "",
  border: { width: 0, color: "#e5e7eb", style: "solid", radius: 0 },
  position: "static",
  top: dim(0),
  left: dim(0),
  right: dim(0),
  bottom: dim(0),
};

// Templates saved before CommonStyle (or before Dimension) existed are
// missing/old-shaped fields in their stored JSON; merge in defaults and
// normalize offsets at render time so old blocks don't crash.
export function withCommonDefaults<T extends Partial<CommonStyle>>(
  style: T
): T & CommonStyle {
  return {
    ...DEFAULT_COMMON_STYLE,
    ...style,
    border: {
      ...DEFAULT_COMMON_STYLE.border,
      ...style.border,
      radius: toCorners(style.border?.radius, 0),
    },
    top: toDimension(style.top, DEFAULT_COMMON_STYLE.top as Dimension),
    left: toDimension(style.left, DEFAULT_COMMON_STYLE.left as Dimension),
    right: toDimension(style.right, DEFAULT_COMMON_STYLE.right as Dimension),
    bottom: toDimension(style.bottom, DEFAULT_COMMON_STYLE.bottom as Dimension),
  };
}

/** Web-safe system font stacks — reliable in Outlook, Gmail, Apple Mail (no web fonts). */
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, sans-serif" },
  { label: "Lucida Sans", value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Lucida Console", value: "'Lucida Console', Monaco, monospace" },
];
export const DEFAULT_FONT_FAMILY = FONT_OPTIONS[0].value;

export type FontWeight = 400 | 500 | 600 | 700;
export const FONT_WEIGHT_OPTIONS: { label: string; value: FontWeight }[] = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
];

export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export const TEXT_TRANSFORM_OPTIONS: { label: string; value: TextTransform }[] = [
  { label: "None", value: "none" },
  { label: "Uppercase", value: "uppercase" },
  { label: "Lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
];

export type TextDecoration = "none" | "underline" | "line-through";
export const TEXT_DECORATION_OPTIONS: { label: string; value: TextDecoration }[] = [
  { label: "None", value: "none" },
  { label: "Underline", value: "underline" },
  { label: "Strikethrough", value: "line-through" },
];

export type FontStyle = "normal" | "italic";
export const FONT_STYLE_OPTIONS: { label: string; value: FontStyle }[] = [
  { label: "Normal", value: "normal" },
  { label: "Italic", value: "italic" },
];

export const TEXT_ALIGN_OPTIONS: { label: string; value: "left" | "center" | "right" }[] = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export type TextVerticalAlign = "top" | "middle" | "bottom";
export const TEXT_VERTICAL_ALIGN_OPTIONS: { label: string; value: TextVerticalAlign }[] = [
  { label: "Top", value: "top" },
  { label: "Middle", value: "middle" },
  { label: "Bottom", value: "bottom" },
];

export interface TextBlock extends BaseBlock {
  type: "text";
  content: { html: string };
  style: {
    align: "left" | "center" | "right";
    color: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontFamily: string;
    fontWeight: FontWeight;
    textTransform: TextTransform;
    textDecoration: TextDecoration;
    fontStyle: FontStyle;
    verticalAlign: TextVerticalAlign;
    width: number | Dimension;
    height: number | Dimension;
    padding: number | Sides;
  } & CommonStyle;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  content: { src: string; alt: string; href: string };
  style: {
    width: number | Dimension;
    height: number | Dimension;
    align: "left" | "center" | "right";
    padding: number | Sides;
  } & CommonStyle;
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  content: { label: string; href: string };
  style: {
    align: "left" | "center" | "right";
    bgColor: string;
    textColor: string;
    borderRadius: number;
    width: number | Dimension;
    height: number | Dimension;
    padding: number | Sides;
  } & CommonStyle;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  content: Record<string, never>;
  style: { color: string; thickness: number; lineStyle?: "solid" | "dashed" | "dotted"; padding: number | Sides } & CommonStyle;
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  content: Record<string, never>;
  style: { height: number | Dimension } & CommonStyle;
}

export interface StackBlock extends BaseBlock {
  type: "stack";
  content: Record<string, never>;
  style: {
    direction: "row" | "column";
    gap: number;
    padding: number | Sides;
    justify: FlexJustify;
    align: FlexAlign;
    width: number | Dimension;
    height: number | Dimension;
  } & CommonStyle;
  children: Block[];
}

export interface SocialBlock extends BaseBlock {
  type: "social";
  content: import("@/lib/social").SocialContent;
  style: {
    align: "left" | "center" | "right";
    iconColor: string;
    width: number | Dimension;
    height: number | Dimension;
    padding: number | Sides;
    gap?: number;
  } & CommonStyle;
}

export type Block =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | StackBlock
  | SocialBlock;

export interface Template {
  id: string;
  name: string;
  content: Block[];
  createdAt: number;
  updatedAt: number;
}
