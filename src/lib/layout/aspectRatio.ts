import type { Block, Dimension, StackBlock } from "@/lib/types";
import { dim, toDimension } from "@/lib/types";
import { getBlockHeightDim, getBlockWidthDim } from "@/lib/layout/dimensions";
import {
  getParentHeightPxForBlock,
  getParentWidthPxForBlock,
  measureBlockSizePx,
} from "@/lib/layout/convertDimension";

const MIN_WIDTH_PX = 16;
const MIN_HEIGHT_PX = 8;

export function blockSupportsAspectRatioLock(block: Block): boolean {
  return (
    block.type === "text" ||
    block.type === "image" ||
    block.type === "button" ||
    block.type === "stack"
  );
}

export function measureBlockAspectRatio(blockId: string, zoom: number): number | null {
  const size = measureBlockSizePx(blockId, zoom);
  if (!size || size.height <= 0) return null;
  return size.width / size.height;
}

function dimensionToPx(d: Dimension, parentPx: number): number | null {
  switch (d.unit) {
    case "px":
      return d.value;
    case "%":
      return (d.value / 100) * parentPx;
    case "fill":
      return parentPx;
    default:
      return null;
  }
}

function clampWidthPx(value: number, parentWidthPx: number): number {
  return Math.min(Math.max(Math.round(value), MIN_WIDTH_PX), parentWidthPx);
}

function clampHeightPx(value: number): number {
  return Math.max(Math.round(value), MIN_HEIGHT_PX);
}

/** Snap both axes to px using a width/height ratio. */
export function coupledPxDimensions(
  widthPx: number,
  heightPx: number,
  parentWidthPx: number
): { width: Dimension; height: Dimension } {
  return {
    width: dim(clampWidthPx(widthPx, parentWidthPx), "px"),
    height: dim(clampHeightPx(heightPx), "px"),
  };
}

export function coupleDimensionChange(
  block: Block,
  root: StackBlock,
  blockId: string,
  axis: "width" | "height",
  next: Dimension,
  ratio: number
): { width: Dimension; height: Dimension; unlock?: boolean } {
  const currentHeight = getBlockHeightDim(block);
  const currentWidth = getBlockWidthDim(block) ?? dim(0, "fit-content");
  const parentWidthPx = getParentWidthPxForBlock(root, blockId);
  const parentHeightPx = getParentHeightPxForBlock(root, blockId);

  if (next.unit === "fit-content" || next.unit === "fill") {
    return {
      width: axis === "width" ? next : currentWidth,
      height: axis === "height" ? next : currentHeight,
      unlock: true,
    };
  }

  if (axis === "width") {
    const widthPx = dimensionToPx(next, parentWidthPx);
    if (widthPx == null) return { width: next, height: currentHeight };
    return coupledPxDimensions(widthPx, widthPx / ratio, parentWidthPx);
  }

  const heightPx = dimensionToPx(next, parentHeightPx);
  if (heightPx == null) return { width: currentWidth, height: next };
  return coupledPxDimensions(heightPx * ratio, heightPx, parentWidthPx);
}

export function resizeWithAspectRatio(
  startWidth: number,
  startHeight: number,
  deltaWidth: number,
  deltaHeight: number,
  resizeW: boolean,
  resizeH: boolean,
  ratio: number,
  parentWidthPx: number
): { width: Dimension; height: Dimension } {
  if (resizeW && resizeH) {
    const dominant = Math.abs(deltaWidth) >= Math.abs(deltaHeight) ? "width" : "height";
    if (dominant === "width") {
      const widthPx = clampWidthPx(startWidth + deltaWidth, parentWidthPx);
      return coupledPxDimensions(widthPx, widthPx / ratio, parentWidthPx);
    }
    const heightPx = clampHeightPx(startHeight + deltaHeight);
    return coupledPxDimensions(heightPx * ratio, heightPx, parentWidthPx);
  }

  if (resizeW) {
    const widthPx = clampWidthPx(startWidth + deltaWidth, parentWidthPx);
    return coupledPxDimensions(widthPx, widthPx / ratio, parentWidthPx);
  }

  const heightPx = clampHeightPx(startHeight + deltaHeight);
  return coupledPxDimensions(heightPx * ratio, heightPx, parentWidthPx);
}

/** Toggle lock on/off; enabling captures the current rendered ratio and snaps size to px. */
export function aspectRatioLockPatch(
  block: Block,
  zoom: number
): Partial<Block> & { style?: Block["style"] } {
  if (block.lockAspectRatio) {
    return { lockAspectRatio: false, aspectRatio: undefined };
  }

  const ratio = measureBlockAspectRatio(block.id, zoom);
  const size = measureBlockSizePx(block.id, zoom);
  if (!ratio || !size || !("width" in block.style && "height" in block.style)) {
    return {};
  }

  return {
    lockAspectRatio: true,
    aspectRatio: ratio,
    style: {
      ...block.style,
      width: dim(Math.round(size.width), "px"),
      height: dim(Math.round(size.height), "px"),
    },
  } as Partial<Block> & { style?: Block["style"] };
}

/** Resolve width/height px for ratio fallback when aspectRatio field is missing. */
export function resolveBlockSizePx(
  root: StackBlock,
  block: Block,
  blockId: string,
  zoom: number
): { widthPx: number; heightPx: number } | null {
  const measured = measureBlockSizePx(blockId, zoom);
  if (measured && measured.width > 0 && measured.height > 0) {
    return { widthPx: measured.width, heightPx: measured.height };
  }

  const widthDim = getBlockWidthDim(block);
  const heightDim = getBlockHeightDim(block);
  if (!widthDim) return null;

  const parentWidthPx = getParentWidthPxForBlock(root, blockId);
  const parentHeightPx = getParentHeightPxForBlock(root, blockId);
  const widthPx = dimensionToPx(toDimension(widthDim, dim(0, "fit-content")), parentWidthPx);
  const heightPx = dimensionToPx(toDimension(heightDim, dim(0, "fit-content")), parentHeightPx);
  if (widthPx == null || heightPx == null || heightPx <= 0) return null;

  return { widthPx, heightPx };
}
