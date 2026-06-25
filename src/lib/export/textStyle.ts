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
import type { FlexJustify } from "@/lib/types";
import { isFillHeight, isPercentHeight } from "@/lib/layout/dimensions";
import { isDistributedJustify } from "@/lib/layout/flexAlign";

export function normalizeTextTypography(style: Partial<TextBlock["style"]>) {
  return {
    fontWeight: (style.fontWeight ?? 400) as FontWeight,
    textTransform: (style.textTransform ?? "none") as TextTransform,
    textDecoration: (style.textDecoration ?? "none") as TextDecoration,
    fontStyle: (style.fontStyle ?? "normal") as FontStyle,
    verticalAlign: (style.verticalAlign ?? "top") as TextVerticalAlign,
  };
}

export function hasFixedTextHeight(style: Partial<TextBlock["style"]>): boolean {
  const height = toDimension(style.height, dim(0, "fit-content"));
  return height.unit !== "fit-content";
}

/** HTML export — only use fixed-height frames when height is px/% or fill inside a sized parent. */
export function hasExportFixedTextHeight(
  style: Partial<TextBlock["style"]>,
  ctx?: { parentHasHeight?: boolean }
): boolean {
  const height = toDimension(style.height, dim(0, "fit-content"));
  if (height.unit === "px" || height.unit === "%") return true;
  if (height.unit === "fill" && ctx?.parentHasHeight) return true;
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
}

/** Outer text frame — fixed size with border-box (Framer-style frame). */
export function textBoxToReactStyle(style: Partial<TextBlock["style"]>): CSSProperties {
  const width = toDimension(style.width, dim(0, "fill"));
  const height = toDimension(style.height, dim(0, "fit-content"));
  const css: CSSProperties = { boxSizing: "border-box" };

  if (width.unit !== "fit-content") css.width = dimToCss(width);
  if (width.unit === "fill") {
    css.maxWidth = "100%";
    css.alignSelf = "stretch";
  }

  if (isFillHeight(height)) {
    applyTextFrameLayout(css);
    css.flex = "1 1 0%";
    css.alignSelf = "stretch";
    css.width = css.width ?? "100%";
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
  const { fontWeight, textTransform, textDecoration, fontStyle } = normalizeTextTypography(style);
  return [
    `text-align:${style.align ?? "left"}`,
    `color:${style.color ?? "#1a1a1a"}`,
    `font-size:${style.fontSize ?? 16}px`,
    `font-family:${fontFamily}`,
    `font-weight:${fontWeight}`,
    `text-transform:${textTransform}`,
    `text-decoration:${textDecoration}`,
    `font-style:${fontStyle}`,
    "line-height:1.5",
  ].join(";");
}

export function textVerticalAlignToCss(style: Partial<TextBlock["style"]>): string {
  const { verticalAlign } = normalizeTextTypography(style);
  return `vertical-align:${verticalAlign};`;
}

export function textTypographyToReactStyle(style: Partial<TextBlock["style"]>): CSSProperties {
  const fontFamily = style.fontFamily || DEFAULT_FONT_FAMILY;
  const { fontWeight, textTransform, textDecoration, fontStyle } = normalizeTextTypography(style);
  return {
    textAlign: style.align ?? "left",
    color: style.color ?? "#1a1a1a",
    fontSize: style.fontSize ?? 16,
    fontFamily,
    fontWeight,
    textTransform,
    textDecoration,
    fontStyle,
    lineHeight: 1.5,
    width: "100%",
  };
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
    }
  }
  if (height.unit === "px" || height.unit === "%") {
    parts.push(`height:${dimToCss(height)}`);
  } else if (height.unit === "fill" && options?.parentHasHeight) {
    parts.push("height:100%");
  }
  if (width.unit === "fill" && !options?.inRowStack) parts.push("max-width:100%");
  return parts.join(";");
}
