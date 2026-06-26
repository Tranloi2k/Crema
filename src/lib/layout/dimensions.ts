import type { Block, Dimension, StackBlock } from "@/lib/types";
import { dim, toDimension, type FlexJustify } from "@/lib/types";
import { isDistributedJustify } from "@/lib/layout/flexAlign";
export function getBlockHeightDim(block: Block): Dimension {
  switch (block.type) {
    case "text":
    case "image":
    case "stack":
    case "button":
      return toDimension(block.style.height, dim(0, "fit-content"));
    case "spacer":
      return toDimension(block.style.height, dim(24));
    case "social":
      return toDimension(block.style.height, dim(32));
    default:
      return dim(0, "fit-content");
  }
}

/** Which axes can be drag-resized on the canvas for a given block type. */
export function blockResizableAxes(block: Block): { width: boolean; height: boolean } {
  switch (block.type) {
    case "text":
    case "image":
    case "button":
    case "stack":
    case "social":
      return { width: true, height: true };
    case "spacer":
      return { width: false, height: true };
    default:
      return { width: false, height: false };
  }
}

export function getBlockWidthDim(block: Block): Dimension | null {
  switch (block.type) {
    case "text":
      return toDimension(block.style.width, dim(0, "fill"));
    case "image":
      return toDimension(block.style.width, dim(560));
    case "button":
      return toDimension(block.style.width, dim(0, "fit-content"));
    case "stack":
      return toDimension(block.style.width, dim(0, "fit-content"));
    case "social":
      return toDimension(block.style.width, dim(32));
    default:
      return null;
  }
}

export function blockUsesFillWidth(block: Block): boolean {
  const w = getBlockWidthDim(block);
  if (!w) return false;
  return isFillWidth(w) || isPercentWidth(w);
}

/** Blocks with a definite content width (px / fit-content) — not fill or %. */
export function blockShrinksToContentWidth(block: Block): boolean {
  return !blockUsesFillWidth(block);
}

/** Whether a stack child should span the cross axis (e.g. full width in a column stack). */
export function childFillsStackCrossAxis(block: Block, isRow: boolean): boolean {
  if (isRow) {
    return blockUsesFlexHeight(block) || isFillHeight(getBlockHeightDim(block));
  }
  if (block.type === "divider") return true;
  // A button always occupies a full-width row slot (like the table-based
  // export), then sizes/aligns itself inside via its own width + align.
  if (block.type === "button") return true;
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

/** Whether any child grows along the stack main axis (flex-1). */
export function stackHasFillMainChild(stack: StackBlock): boolean {
  const isRow = stack.style.direction === "row";
  const justify = stack.style.justify ?? "start";
  return stack.children.some((c) => childFillsStackMainAxis(c, isRow, justify));
}

/**
 * Row stacks that should collapse to a single column below 480px.
 * Compact rows (logo + label, icon + text) stay horizontal when they fit.
 */
export function rowShouldStackOnMobile(stack: StackBlock): boolean {
  const justify = stack.style.justify ?? "start";
  const children = stack.children;
  if (children.length <= 1) return false;
  if (isDistributedJustify(justify)) return true;

  const fillMainCount = children.filter((c) => childFillsStackMainAxis(c, true, justify)).length;
  if (fillMainCount >= 2) return true;
  if (children.length >= 3) return true;
  return false;
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

export function isFillWidth(d: Dimension): boolean {
  return d.unit === "fill";
}

export function isPercentWidth(d: Dimension): boolean {
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
