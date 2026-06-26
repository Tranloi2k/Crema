import type { CSSProperties } from "react";
import type { TextBlock } from "@/lib/types";
import {
  DEFAULT_FONT_FAMILY,
  dim,
  dimToCss,
  toDimension,
  type FontStyle,
  type FontWeight,
  type TextDecoration,
  type TextTransform,
  type TextVerticalAlign,
} from "@/lib/types";
import type { FlexJustify, FlexAlign } from "@/lib/types";
import { isFillHeight, isPercentHeight } from "@/lib/layout/dimensions";
import { isDistributedJustify } from "@/lib/layout/flexAlign";

export function normalizeTextTypography(style: Partial<TextBlock["style"]>) {
  return {
    fontWeight: (style.fontWeight ?? 400) as FontWeight,
    textTransform: (style.textTransform ?? "none") as TextTransform,
    textDecoration: (style.textDecoration ?? "none") as TextDecoration,
    fontStyle: (style.fontStyle ?? "normal") as FontStyle,
    verticalAlign: (style.verticalAlign ?? "top") as TextVerticalAlign,
    lineHeight: style.lineHeight ?? 1.5,
    letterSpacing: style.letterSpacing ?? 0,
  };
}

export function hasFixedTextHeight(style: Partial<TextBlock["style"]>): boolean {
  const height = toDimension(style.height, dim(0, "fit-content"));
  return height.unit !== "fit-content";
}

/** HTML export — only use fixed-height frames when height is px/% or fill inside a sized parent. */
export function hasExportFixedTextHeight(
  style: Partial<TextBlock["style"]>,
  ctx?: { inRowStack?: boolean; parentHasHeight?: boolean }
): boolean {
  const height = toDimension(style.height, dim(0, "fit-content"));
  if (height.unit === "px" || height.unit === "%") return true;
  if (height.unit === "fill" && (ctx?.parentHasHeight || ctx?.inRowStack)) return true;
  return false;
}

function verticalAlignToJustify(verticalAlign: TextVerticalAlign): CSSProperties["justifyContent"] {
  if (verticalAlign === "middle") return "center";
  if (verticalAlign === "bottom") return "flex-end";
  return "flex-start";
}

function applyTextFrameLayout(css: CSSProperties) {
  css.display = "flex";
  css.flexDirection = "column";
  css.overflow = "hidden";
  css.minHeight = 0;
  css.minWidth = 0;
}

/** Outer text frame — fixed size with border-box (Framer-style frame). */
export function textBoxToReactStyle(
  style: Partial<TextBlock["style"]>,
  options?: { crossAxisFill?: boolean }
): CSSProperties {
  const width = toDimension(style.width, dim(0, "fill"));
  const height = toDimension(style.height, dim(0, "fit-content"));
  // Never let a text frame grow wider than the slot it sits in (prevents long
  // unbroken lines from pushing past a fill/% parent in the editor canvas).
  const css: CSSProperties = { boxSizing: "border-box", maxWidth: "100%", minWidth: 0 };

  if (width.unit !== "fit-content") css.width = dimToCss(width);
  if (width.unit === "fill") {
    css.alignSelf = "stretch";
  }

  if (isFillHeight(height)) {
    applyTextFrameLayout(css);
    css.alignSelf = "stretch";
    css.width = css.width ?? "100%";
    if (options?.crossAxisFill) {
      css.height = "100%";
    } else {
      css.flex = "1 1 0%";
    }
  } else if (isPercentHeight(height)) {
    applyTextFrameLayout(css);
    css.height = dimToCss(height);
    css.flexShrink = 0;
    css.alignSelf = "stretch";
    css.width = css.width ?? "100%";
  } else if (height.unit === "px") {
    applyTextFrameLayout(css);
    css.height = dimToCss(height);
  }

  return css;
}

/** Inner wrapper — vertical alignment inside a fixed-height frame. */
export function textInnerLayoutStyle(style: Partial<TextBlock["style"]>): CSSProperties {
  if (!hasFixedTextHeight(style)) {
    return { width: "100%" };
  }
  const { verticalAlign } = normalizeTextTypography(style);
  return {
    flex: 1,
    minHeight: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: verticalAlignToJustify(verticalAlign),
    overflow: "hidden",
  };
}

export function textTypographyToCss(style: Partial<TextBlock["style"]>): string {
  const fontFamily = style.fontFamily || DEFAULT_FONT_FAMILY;
  const { fontWeight, textTransform, textDecoration, fontStyle, lineHeight, letterSpacing } =
    normalizeTextTypography(style);
  return [
    `text-align:${style.align ?? "left"}`,
    `color:${style.color ?? "#1a1a1a"}`,
    `font-size:${style.fontSize ?? 16}px`,
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `text-transform:${textTransform}`,
    `text-decoration:${textDecoration}`,
    `font-style:${fontStyle}`,
    `line-height:${lineHeight}`,
    `letter-spacing:${letterSpacing}px`,
  ].join(";");
}

/** Nested table attrs for fixed-height text — stretches to the outer cell in row stacks. */
export function textExportInnerTableCss(fixedHeight: boolean): string {
  if (!fixedHeight) return "border-collapse:collapse;";
  return "border-collapse:collapse;width:100%;height:100%;";
}

export function textExportInnerTableAttrs(fixedHeight: boolean): string {
  return fixedHeight ? ' width="100%" height="100%"' : "";
}

export function textExportInnerCellCss(
  typography: string,
  valign: TextVerticalAlign,
  nowrap: string,
  fixedHeight: boolean
): string {
  const heightCss = fixedHeight ? "height:100%;" : "";
  return `${typography};${nowrap}vertical-align:${valign};${heightCss}`;
}

export function textVerticalAlignToCss(style: Partial<TextBlock["style"]>): string {
  const { verticalAlign } = normalizeTextTypography(style);
  return `vertical-align:${verticalAlign};`;
}

/** Row-stack cross-axis alignment for fit-content text cells (uses stack align, not block verticalAlign). */
export function stackCrossAlignToVerticalCss(align?: FlexAlign): string {
  if (align === "center") return "vertical-align:middle;";
  if (align === "end") return "vertical-align:bottom;";
  return "vertical-align:top;";
}

export function textTypographyToReactStyle(style: Partial<TextBlock["style"]>): CSSProperties {
  const fontFamily = style.fontFamily || DEFAULT_FONT_FAMILY;
  const { fontWeight, textTransform, textDecoration, fontStyle, lineHeight, letterSpacing } =
    normalizeTextTypography(style);
  return {
    textAlign: style.align ?? "left",
    color: style.color ?? "#1a1a1a",
    fontSize: style.fontSize ?? 16,
    fontFamily,
    fontWeight,
    textTransform,
    textDecoration,
    fontStyle,
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    width: "100%",
  };
}

/** CSS custom properties for live TipTap typography (updates without re-mounting the editor). */
export function textTypographyToCssVars(style: Partial<TextBlock["style"]>): CSSProperties {
  const t = textTypographyToReactStyle(style);
  return {
    "--crema-text-font-family": t.fontFamily,
    "--crema-text-font-size": `${t.fontSize}px`,
    "--crema-text-color": t.color,
    "--crema-text-font-weight": String(t.fontWeight),
    "--crema-text-align": t.textAlign,
    "--crema-text-transform": t.textTransform,
    "--crema-text-decoration": t.textDecoration,
    "--crema-text-font-style": t.fontStyle,
    "--crema-text-line-height": String(t.lineHeight),
    "--crema-text-letter-spacing": t.letterSpacing,
  } as CSSProperties;
}

export function textSizeToCss(
  style: Partial<TextBlock["style"]>,
  options?: { inRowStack?: boolean; rowJustify?: FlexJustify; parentHasHeight?: boolean }
): string {
  const width = toDimension(style.width, dim(0, "fill"));
  const height = toDimension(style.height, dim(0, "fit-content"));
  const distributedRow =
    options?.inRowStack && options.rowJustify && isDistributedJustify(options.rowJustify);
  const parts: string[] = [];
  if (width.unit !== "fit-content" && !distributedRow) {
    if (width.unit === "fill" && options?.inRowStack) {
      parts.push("max-width:100%");
    } else {
      parts.push(`width:${dimToCss(width)}`);
      // Keep fixed (px) / relative (%) text from overflowing narrow mobile screens.
      if (width.unit === "px" || width.unit === "%") parts.push("max-width:100%");
    }
  }
  if (height.unit === "px" || height.unit === "%") {
    parts.push(`height:${dimToCss(height)}`);
  } else if (height.unit === "fill" && (options?.parentHasHeight || options?.inRowStack)) {
    parts.push("height:100%");
  }
  if (width.unit === "fill" && !options?.inRowStack) parts.push("max-width:100%");
  return parts.join(";");
}
