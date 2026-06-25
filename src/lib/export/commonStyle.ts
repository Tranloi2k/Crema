import type { CSSProperties } from "react";
import { withCommonDefaults, dimToCss, toCorners, cornersToCss, type CommonStyle } from "@/lib/types";

function hasVisibleRadius(style: ReturnType<typeof withCommonDefaults>): boolean {
  const c = toCorners(style.border.radius);
  return c.topLeft > 0 || c.topRight > 0 || c.bottomRight > 0 || c.bottomLeft > 0;
}

export function commonStyleToReactStyle(style: Partial<CommonStyle>): CSSProperties {
  const s = withCommonDefaults(style);
  const css: CSSProperties = {};

  if (s.bgColor) css.backgroundColor = s.bgColor;
  if (s.border.width > 0) {
    css.borderWidth = s.border.width;
    css.borderColor = s.border.color;
    css.borderStyle = s.border.style;
  }
  const radiusCss = cornersToCss(toCorners(s.border.radius));
  if (radiusCss) {
    css.borderRadius = radiusCss;
    css.overflow = "hidden";
  }

  if (s.position !== "static") {
    css.position = s.position;
    if (s.top.value) css.top = dimToCss(s.top);
    if (s.left.value) css.left = dimToCss(s.left);
    if (s.right.value) css.right = dimToCss(s.right);
    if (s.bottom.value) css.bottom = dimToCss(s.bottom);
  }

  return css;
}

export function commonStyleToCssString(
  style: Partial<CommonStyle>,
  options?: { clipRadius?: boolean }
): string {
  const s = withCommonDefaults(style);
  const declarations: string[] = [];

  if (s.bgColor) declarations.push(`background-color:${s.bgColor}`);
  if (s.border.width > 0) {
    declarations.push(`border:${s.border.width}px ${s.border.style} ${s.border.color}`);
  }
  const radiusCss = cornersToCss(toCorners(s.border.radius));
  if (radiusCss) {
    declarations.push(`border-radius:${radiusCss}`);
    if (options?.clipRadius !== false) declarations.push("overflow:hidden");
  }

  if (s.position !== "static") {
    declarations.push(`position:${s.position}`);
    if (s.top.value) declarations.push(`top:${dimToCss(s.top)}`);
    if (s.left.value) declarations.push(`left:${dimToCss(s.left)}`);
    if (s.right.value) declarations.push(`right:${dimToCss(s.right)}`);
    if (s.bottom.value) declarations.push(`bottom:${dimToCss(s.bottom)}`);
  }

  return declarations.join(";");
}

/** Container tables (root email, stacks) — border-radius needs separate borders in HTML. */
export function commonContainerTableCss(style: Partial<CommonStyle>): string {
  const s = withCommonDefaults(style);
  const parts = [commonStyleToCssString(style)];
  if (s.border.width > 0 || hasVisibleRadius(s)) {
    parts.push("border-collapse:separate", "border-spacing:0");
  } else {
    parts.push("border-collapse:collapse");
  }
  return parts.filter(Boolean).join(";");
}
