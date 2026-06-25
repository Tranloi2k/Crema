import type { Dimension, StackBlock, Unit } from "@/lib/types";
import { dim, toDimension } from "@/lib/types";
import { getParentStack } from "@/lib/store/editorStore";

/** Canvas email frame height used as the root stack's parent reference. */
export const CANVAS_EMAIL_HEIGHT_PX = 600;

/** Canvas email frame width used as the root stack's parent reference. */
export const CANVAS_EMAIL_WIDTH_PX = 600;

function resolveHeightToPx(h: Dimension, parentPx: number): number {
  switch (h.unit) {
    case "px":
      return h.value;
    case "%":
      return (h.value / 100) * parentPx;
    case "fill":
      return parentPx;
    default:
      return h.value;
  }
}

/** Convert a height dimension when the user switches Fixed / Relative / Fill. */
export function convertDimensionUnit(current: Dimension, nextUnit: Unit, parentPx: number): Dimension {
  const safeParent = Math.max(parentPx, 1);
  const px = resolveHeightToPx(current, safeParent);

  switch (nextUnit) {
    case "px":
      return dim(Math.max(0, Math.round(px)), "px");
    case "%":
      return dim(Math.max(0, Math.round((px / safeParent) * 100)), "%");
    case "fill":
      return dim(Math.round(safeParent), "fill");
    case "fit-content":
      return dim(0, "fit-content");
    default:
      return { ...current, unit: nextUnit };
  }
}

function resolveStackFrameHeightPx(stack: StackBlock, outerPx: number): number {
  const h = toDimension(stack.style.height, dim(0, "fit-content"));
  switch (h.unit) {
    case "px":
      return h.value;
    case "%":
      return (h.value / 100) * outerPx;
    case "fill":
      return outerPx;
    default:
      return outerPx;
  }
}

function getRootFrameHeightPx(root: StackBlock): number {
  const h = toDimension(root.style.height, dim(0, "fit-content"));
  if (h.unit === "px" && h.value > 0) return h.value;
  return CANVAS_EMAIL_HEIGHT_PX;
}

/** Parent stack frame height in px — used to convert child height units. */
export function getParentHeightPxForBlock(root: StackBlock, blockId: string): number {
  if (blockId === root.id) return getRootFrameHeightPx(root);

  const parent = getParentStack(root, blockId);
  if (!parent) return getRootFrameHeightPx(root);

  const outerPx =
    parent.id === root.id ? getRootFrameHeightPx(root) : getParentHeightPxForBlock(root, parent.id);

  return Math.max(1, Math.round(resolveStackFrameHeightPx(parent, outerPx)));
}

function resolveStackFrameWidthPx(stack: StackBlock, outerPx: number): number {
  const w = toDimension(stack.style.width, dim(0, "fit-content"));
  switch (w.unit) {
    case "px":
      return w.value;
    case "%":
      return (w.value / 100) * outerPx;
    case "fill":
      return outerPx;
    default:
      return outerPx;
  }
}

/** Parent stack frame width in px — used to convert child width units. */
export function getParentWidthPxForBlock(root: StackBlock, blockId: string): number {
  if (blockId === root.id) return CANVAS_EMAIL_WIDTH_PX;

  const parent = getParentStack(root, blockId);
  if (!parent) return CANVAS_EMAIL_WIDTH_PX;

  const outerPx =
    parent.id === root.id ? CANVAS_EMAIL_WIDTH_PX : getParentWidthPxForBlock(root, parent.id);

  return Math.max(1, Math.round(resolveStackFrameWidthPx(parent, outerPx)));
}
