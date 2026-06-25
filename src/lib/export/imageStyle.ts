import type { CSSProperties } from "react";
import type { Dimension } from "@/lib/types";
import { dimToCss } from "@/lib/types";

export function imageSizeCss(width: Dimension, height: Dimension) {
  const widthCss = dimToCss(width);
  const heightCss = height.unit === "fit-content" ? "auto" : dimToCss(height);
  const fixedHeight = height.unit !== "fit-content";
  const bothPx = width.unit === "px" && height.unit === "px";

  return {
    widthCss,
    heightCss,
    widthAttr: width.unit === "px" ? width.value : undefined,
    heightAttr: height.unit === "px" ? height.value : undefined,
    objectFit: bothPx || (fixedHeight && width.unit === "px") ? ("fill" as const) : undefined,
  };
}

export function imageAlignMargins(align: "left" | "center" | "right"): Pick<
  CSSProperties,
  "marginLeft" | "marginRight"
> {
  if (align === "center") return { marginLeft: "auto", marginRight: "auto" };
  if (align === "right") return { marginLeft: "auto", marginRight: 0 };
  return { marginLeft: 0, marginRight: "auto" };
}

export function imageToReactStyle(
  width: Dimension,
  height: Dimension,
  align: "left" | "center" | "right"
): CSSProperties {
  const { widthCss, heightCss, objectFit } = imageSizeCss(width, height);
  return {
    display: "block",
    width: widthCss,
    maxWidth: "100%",
    height: heightCss,
    border: 0,
    ...imageAlignMargins(align),
    ...(objectFit ? { objectFit } : {}),
  };
}

export function imageToHtmlAttrs(width: Dimension, height: Dimension) {
  const { widthCss, heightCss, widthAttr, heightAttr, objectFit } = imageSizeCss(width, height);
  const objectFitCss = objectFit ? `object-fit:${objectFit};` : "";
  return {
    widthAttr: widthAttr !== undefined ? ` width="${widthAttr}"` : "",
    heightAttr: heightAttr !== undefined ? ` height="${heightAttr}"` : "",
    style: `display:block;width:${widthCss};max-width:100%;height:${heightCss};border:0;${objectFitCss}`,
  };
}
