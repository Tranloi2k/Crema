import type { FlexAlign, FlexJustify } from "@/lib/types";

export function flexAlignToCss(a: FlexAlign | undefined): "flex-start" | "center" | "flex-end" {
  if (a === "center") return "center";
  if (a === "end") return "flex-end";
  return "flex-start";
}

export function flexJustifyToCss(
  a: FlexJustify | undefined
): "flex-start" | "center" | "flex-end" | "space-between" | "space-evenly" {
  if (a === "center") return "center";
  if (a === "end") return "flex-end";
  if (a === "between") return "space-between";
  if (a === "evenly") return "space-evenly";
  return "flex-start";
}

export function isDistributedJustify(justify: FlexJustify | undefined): boolean {
  return justify === "between" || justify === "evenly";
}
