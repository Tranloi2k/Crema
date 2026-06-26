import type { CSSProperties } from "react";
import type { Dimension } from "@/lib/types";
import { dimToCss } from "@/lib/types";
import { isFillHeight, isFillWidth, isPercentHeight, isPercentWidth } from "@/lib/layout/dimensions";

const BUTTON_PADDING_FIT = "10px 20px";
const BUTTON_PADDING_FIXED_H = "0 20px";

export function isZeroPxDimension(d: Dimension): boolean {
  return d.unit === "px" && d.value <= 0;
}

export function isButtonCollapsed(width: Dimension, height: Dimension): boolean {
  return isZeroPxDimension(width) || isZeroPxDimension(height);
}

export function buttonUsesFixedHeight(height: Dimension): boolean {
  return height.unit === "px" || isPercentHeight(height);
}

export function buttonUsesFillHeight(height: Dimension): boolean {
  return isFillHeight(height);
}

/** Button spans the full width of its parent row (fill only — not %). */
export function buttonSpansParentWidth(width: Dimension): boolean {
  return isFillWidth(width);
}

/** Button wrapper needs a full-width containing block (fill or %). */
export function buttonNeedsWidthContainer(width: Dimension): boolean {
  return isFillWidth(width) || isPercentWidth(width);
}

export function buttonTableWidthAttr(width: Dimension): string {
  if (isFillWidth(width)) return ' width="100%"';
  if (width.unit === "px" && width.value > 0) return ` width="${width.value}"`;
  // Shrink-wrap in Outlook / legacy clients when width is content-driven.
  if (width.unit === "fit-content") return ' width="1"';
  return "";
}

export function buttonTableAlignAttr(
  align: "left" | "center" | "right",
  width: Dimension
): string {
  if (isFillWidth(width)) return "";
  return ` align="${align}"`;
}

export function buttonTablePresentationStyle(
  align: "left" | "center" | "right",
  width: Dimension
): string {
  const margin = buttonTableMargin(align, width);
  if (isFillWidth(width)) return margin;
  // max-width:100% lets fixed/relative buttons shrink on narrow mobile screens
  // instead of overflowing the viewport (the width="" attr alone would not).
  if (isPercentWidth(width)) return `width:${dimToCss(width)};max-width:100%;${margin}`;
  if (width.unit === "px") return `width:${width.value}px;max-width:100%;${margin}`;
  return `width:auto;border-collapse:separate;${margin}`;
}

export function buttonCellWidthStyle(width: Dimension): string {
  if (isZeroPxDimension(width)) return "width:0;padding:0;font-size:0;line-height:0;overflow:hidden;";
  if (width.unit === "px" || isPercentWidth(width) || isFillWidth(width)) {
    return "width:100%;";
  }
  return "";
}

export function buttonCellHeightAttr(height: Dimension): string {
  if (isZeroPxDimension(height)) return "";
  if (height.unit === "px") return ` height="${height.value}"`;
  return "";
}

export function buttonCellHeightStyle(height: Dimension): string {
  if (isZeroPxDimension(height)) {
    return "height:0;padding:0;font-size:0;line-height:0;overflow:hidden;mso-hide:all;";
  }
  if (height.unit === "px") return `height:${height.value}px;mso-height-rule:exactly;`;
  if (isPercentHeight(height)) return `height:${dimToCss(height)};`;
  if (isFillHeight(height)) return "height:100%;";
  return "";
}

export function buttonLinkDisplayStyle(width: Dimension, height: Dimension): string {
  if (isButtonCollapsed(width, height)) return "display:none;font-size:0;line-height:0;";
  if (isFillWidth(width) || isPercentWidth(width) || width.unit === "px") {
    return "display:block;width:100%;";
  }
  return "display:inline-block;";
}

export function buttonLinkHeightStyle(height: Dimension): string {
  if (isZeroPxDimension(height)) return "height:0;line-height:0;padding:0;overflow:hidden;";
  if (height.unit === "px") {
    return `height:${height.value}px;line-height:${height.value}px;mso-height-rule:exactly;mso-line-height-rule:exactly;`;
  }
  if (isPercentHeight(height)) {
    return `height:${dimToCss(height)};line-height:${dimToCss(height)};`;
  }
  if (isFillHeight(height)) return "height:100%;line-height:100%;";
  return "";
}

export function buttonLinkPaddingStyle(height: Dimension, width: Dimension): string {
  if (isButtonCollapsed(width, height)) return "0";
  if (buttonUsesFixedHeight(height) || buttonUsesFillHeight(height)) {
    return BUTTON_PADDING_FIXED_H;
  }
  return BUTTON_PADDING_FIT;
}

export function buttonAlignAttr(align: "left" | "center" | "right"): string {
  return ` align="${align}"`;
}

export function buttonTableMargin(align: "left" | "center" | "right", width: Dimension): string {
  if (isFillWidth(width)) return "margin:0;";
  if (align === "center") return "margin:0 auto;";
  if (align === "right") return "margin:0 0 0 auto;";
  return "margin:0;";
}

function buttonHorizontalAlignStyle(
  align: "left" | "center" | "right",
  width: Dimension
): Pick<CSSProperties, "marginLeft" | "marginRight"> {
  if (isFillWidth(width)) return {};
  if (align === "center") return { marginLeft: "auto", marginRight: "auto" };
  if (align === "right") return { marginLeft: "auto", marginRight: 0 };
  return {};
}

export function buttonToReactStyle(
  width: Dimension,
  height: Dimension,
  align: "left" | "center" | "right",
  colors: { bgColor: string; textColor: string; borderRadius: number }
): CSSProperties {
  if (isButtonCollapsed(width, height)) {
    return { display: "none" };
  }

  const fillW = isFillWidth(width);
  const percentW = isPercentWidth(width);
  const fixedH = buttonUsesFixedHeight(height);
  const fillH = buttonUsesFillHeight(height);

  const widthCss = fillW
    ? "100%"
    : width.unit === "fit-content"
      ? "auto"
      : dimToCss(width);

  const blockDisplay = fillW || percentW || width.unit === "px" ? "block" : "inline-block";

  const style: CSSProperties = {
    display: blockDisplay,
    width: widthCss,
    maxWidth: "100%",
    padding: buttonLinkPaddingStyle(height, width),
    backgroundColor: colors.bgColor,
    color: colors.textColor,
    borderRadius: colors.borderRadius,
    fontSize: 14,
    fontFamily: "Arial, Helvetica, sans-serif",
    textDecoration: "none",
    textAlign: "center",
    boxSizing: "border-box",
    border: 0,
    cursor: "pointer",
    lineHeight: fixedH || fillH ? undefined : "normal",
    whiteSpace: "nowrap",
    ...buttonHorizontalAlignStyle(align, width),
  };

  if (height.unit === "px") {
    style.height = height.value;
    if (fixedH) style.lineHeight = `${height.value}px`;
  } else if (isPercentHeight(height)) {
    style.height = dimToCss(height);
    style.lineHeight = dimToCss(height);
  } else if (fillH) {
    style.height = "100%";
    style.alignSelf = "stretch";
  }

  if (fixedH) {
    style.flexShrink = 0;
  }

  return style;
}

export function buttonWrapperStyle(
  align: "left" | "center" | "right",
  width: Dimension,
  height: Dimension
): CSSProperties {
  const fillH = buttonUsesFillHeight(height);
  // The wrapper always spans its full-width row slot (matching the export
  // table cell). The button then aligns itself within it: inline-block
  // (fit-content) honors textAlign, while block widths (px / % / fill) use
  // their auto margins from buttonToReactStyle.
  return {
    textAlign: fillH ? undefined : align,
    width: "100%",
    height: fillH ? "100%" : undefined,
    display: fillH ? "flex" : undefined,
    flexDirection: fillH ? "column" : undefined,
    alignItems: isFillWidth(width) || fillH ? "stretch" : undefined,
  };
}

export const BUTTON_INNER_PADDING_CSS = BUTTON_PADDING_FIT;
