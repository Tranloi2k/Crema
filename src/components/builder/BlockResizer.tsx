"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Block } from "@/lib/types";
import { dim } from "@/lib/types";
import { useEditorStore, findBlock } from "@/lib/store/editorStore";
import { blockResizableAxes } from "@/lib/layout/dimensions";
import { getParentWidthPxForBlock } from "@/lib/layout/convertDimension";
import {
  resizeWithAspectRatio,
  resolveBlockSizePx,
} from "@/lib/layout/aspectRatio";

const MIN_WIDTH_PX = 16;
const MIN_HEIGHT_PX = 8;

type Box = { left: number; top: number; width: number; height: number };
type Direction = "e" | "s" | "se";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Drag-resize handles overlaid on the currently selected block. Mirrors the
 * "set a fixed size by dragging" behavior of design tools: dragging writes a
 * Fixed (px) width/height. The overlay is rendered inside the block's
 * (position: relative) SortableBlockItem and measures the real rendered box so
 * handles sit on the visible element — even for shrink-to-fit buttons.
 */
export function BlockResizer({
  block,
  containerRef,
}: {
  block: Block;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const zoom = useEditorStore((s) => s.zoom);
  const root = useEditorStore((s) => s.root);
  const axes = blockResizableAxes(block);
  const [box, setBox] = useState<Box | null>(null);
  const draggingRef = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = container?.querySelector<HTMLElement>(
      `[data-resize-target="${CSS.escape(block.id)}"]`
    );
    if (!container || !target) {
      setBox(null);
      return;
    }

    const measure = () => {
      const c = container.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const z = zoom > 0 ? zoom : 1;
      setBox({
        left: (t.left - c.left) / z,
        top: (t.top - c.top) / z,
        width: t.width / z,
        height: t.height / z,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    ro.observe(container);
    return () => ro.disconnect();
    // `root` is included so handles re-measure after any edit relays out the block.
  }, [block.id, containerRef, zoom, root]);

  if (!box || (!axes.width && !axes.height)) return null;

  function startResize(e: React.PointerEvent, dir: Direction) {
    e.preventDefault();
    e.stopPropagation();
    const target = document.querySelector<HTMLElement>(
      `[data-resize-target="${CSS.escape(block.id)}"]`
    );
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const z = zoom > 0 ? zoom : 1;
    const startWidth = rect.width / z;
    const startHeight = rect.height / z;
    const startX = e.clientX;
    const startY = e.clientY;
    const parentWidth = getParentWidthPxForBlock(useEditorStore.getState().root, block.id);
    const resizeW = (dir === "e" || dir === "se") && axes.width;
    const resizeH = (dir === "s" || dir === "se") && axes.height;
    draggingRef.current = true;

    const onMove = (ev: PointerEvent) => {
      const state = useEditorStore.getState();
      const live = findBlock(state.root, block.id);
      if (!live) return;
      const nextStyle: Record<string, unknown> = { ...live.style };
      const deltaW = (ev.clientX - startX) / z;
      const deltaH = (ev.clientY - startY) / z;

      if (live.lockAspectRatio) {
        const ratio =
          live.aspectRatio ??
          (() => {
            const size = resolveBlockSizePx(state.root, live, block.id, state.zoom);
            return size ? size.widthPx / size.heightPx : startWidth / startHeight;
          })();
        if (ratio > 0) {
          const coupled = resizeWithAspectRatio(
            startWidth,
            startHeight,
            deltaW,
            deltaH,
            !!resizeW,
            !!resizeH,
            ratio,
            parentWidth
          );
          nextStyle.width = coupled.width;
          nextStyle.height = coupled.height;
          state.updateBlock(block.id, { style: nextStyle } as unknown as Partial<Block>);
          return;
        }
      }

      if (resizeW) {
        const w = Math.round(clamp(startWidth + deltaW, MIN_WIDTH_PX, parentWidth));
        nextStyle.width = dim(w, "px");
      }
      if (resizeH) {
        const h = Math.round(Math.max(MIN_HEIGHT_PX, startHeight + deltaH));
        nextStyle.height = dim(h, "px");
      }
      state.updateBlock(block.id, { style: nextStyle } as unknown as Partial<Block>);
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      dir === "e" ? "ew-resize" : dir === "s" ? "ns-resize" : "nwse-resize";
  }

  // A wide invisible hit area centered on a small visible dot, so the handle is
  // easy to grab even on tiny (fit-content) blocks.
  function Handle({
    dir,
    left,
    top,
    cursor,
  }: {
    dir: Direction;
    left: number;
    top: number;
    cursor: string;
  }) {
    return (
      <div
        role="presentation"
        onPointerDown={(e) => startResize(e, dir)}
        className="pointer-events-auto absolute z-30 flex items-center justify-center"
        style={{ left, top, width: 22, height: 22, transform: "translate(-50%, -50%)", cursor }}
      >
        <span className="block h-3 w-3 rounded-[3px] border-2 border-primary bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Resize box outline so the draggable bounds are obvious. */}
      <div
        className="absolute rounded-[2px] ring-1 ring-primary/70"
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      />
      {axes.width && (
        <Handle dir="e" left={box.left + box.width} top={box.top + box.height / 2} cursor="ew-resize" />
      )}
      {axes.height && (
        <Handle dir="s" left={box.left + box.width / 2} top={box.top + box.height} cursor="ns-resize" />
      )}
      {axes.width && axes.height && (
        <Handle dir="se" left={box.left + box.width} top={box.top + box.height} cursor="nwse-resize" />
      )}
    </div>
  );
}
