import type { Block, Dimension, StackBlock } from "@/lib/types";
import { dim, toDimension, type FlexJustify } from "@/lib/types";
import { isDistributedJustify } from "@/lib/layout/flexAlign";
export function getBlockHeightDim(block: Block): Dimension {
  switch (block.type) {
    case "text":
    case "image":
    case "stack":
      return toDimension(block.style.height, dim(0, "fit-content"));
    case "spacer":
      return toDimension(block.style.height, dim(24));
    default:
      return dim(0, "fit-content");
  }
}

export function getBlockWidthDim(block: Block): Dimension | null {
  switch (block.type) {
    case "text":
      return toDimension(block.style.width, dim(0, "fill"));
    case "image":
      return toDimension(block.style.width, dim(560));
    case "stack":
      return toDimension(block.style.width, dim(0, "fit-content"));
    default:
      return null;
  }
}

export function blockUsesFillWidth(block: Block): boolean {
  const w = getBlockWidthDim(block);
  if (!w) return false;
  return w.unit === "fill" || w.unit === "%";
}

/** Whether a stack child should span the cross axis (e.g. full width in a column stack). */
export function childFillsStackCrossAxis(block: Block, isRow: boolean): boolean {
  if (isRow) {
    return blockUsesFlexHeight(block) || isFillHeight(getBlockHeightDim(block));
  }
  if (block.type === "divider") return true;
  return blockUsesFillWidth(block);
}

/** Whether a stack child should grow along the main axis (e.g. equal columns in a row stack). */
export function childFillsStackMainAxis(
  block: Block,
  isRow: boolean,
  stackJustify?: FlexJustify
): boolean {
  if (stackJustify && isDistributedJustify(stackJustify)) return false;
  if (isRow) return blockUsesFillWidth(block);
  return isFillHeight(getBlockHeightDim(block));
}

export function isFitHeight(d: Dimension): boolean {
  return d.unit === "fit-content";
}

export function isFillHeight(d: Dimension): boolean {
  return d.unit === "fill";
}

export function isPercentHeight(d: Dimension): boolean {
  return d.unit === "%";
}

export function hasDefiniteHeight(d: Dimension): boolean {
  return !isFitHeight(d);
}

export function blockUsesFlexHeight(block: Block): boolean {
  const h = getBlockHeightDim(block);
  return isFillHeight(h) || isPercentHeight(h);
}

export function stackChildUsesFlexHeight(stack: StackBlock): boolean {
  return stack.children.some(blockUsesFlexHeight);
}

export function stackNeedsColumnHeightLayout(stack: StackBlock, isRow: boolean): boolean {
  if (isRow) return false;
  const stackH = toDimension(stack.style.height, dim(0, "fit-content"));
  return hasDefiniteHeight(stackH) || stackChildUsesFlexHeight(stack);
}

/** Row stack needs a definite height so cross-axis Align (vertical) can take effect. */
export function stackNeedsRowHeightLayout(stack: StackBlock, isRow: boolean): boolean {
  if (!isRow) return false;
  const stackH = toDimension(stack.style.height, dim(0, "fit-content"));
  return hasDefiniteHeight(stackH) || isFillHeight(stackH);
}

/** Row stack needs a definite width so main-axis Distribute (horizontal) can take effect. */
export function stackHasFitHeight(stack: StackBlock): boolean {
  return isFitHeight(toDimension(stack.style.height, dim(0, "fit-content")));
}

export function stackHasFitWidth(stack: StackBlock): boolean {
  return toDimension(stack.style.width, dim(0, "fit-content")).unit === "fit-content";
}

export function stackNeedsRowWidthLayout(stack: StackBlock, isRow: boolean): boolean {
  if (!isRow) return false;
  const stackW = toDimension(stack.style.width, dim(0, "fit-content"));
  return stackW.unit === "px" || stackW.unit === "%" || stackW.unit === "fill";
}
