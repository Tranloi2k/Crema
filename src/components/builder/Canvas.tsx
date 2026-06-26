"use client";

import { useRef } from "react";
import type { StackBlock } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { toSides, sidesToCss, toDimension, dim, dimToCss } from "@/lib/types";
import { stackChildUsesFlexHeight, hasDefiniteHeight } from "@/lib/layout/dimensions";
import { CANVAS_EMAIL_HEIGHT_PX } from "@/lib/layout/convertDimension";
import { StackChildren } from "@/components/builder/blocks/StackBlock";
import { BlockContextMenu } from "@/components/builder/BlockContextMenu";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import type { Tool } from "@/components/builder/ZoomToolbar";
import { cn } from "@/lib/utils";

export function Canvas({ root, zoom, tool }: { root: StackBlock; zoom: number; tool: Tool }) {
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const rootHeight = toDimension(root.style.height, dim(0, "fit-content"));
  const needsHeightFrame =
    hasDefiniteHeight(rootHeight) || stackChildUsesFlexHeight(root);
  const emailHeight =
    rootHeight.unit === "px" || rootHeight.unit === "%"
      ? dimToCss(rootHeight)
      : needsHeightFrame
        ? CANVAS_EMAIL_HEIGHT_PX
        : undefined;

  const viewportRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (tool !== "pan" || !viewportRef.current) return;
    panState.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop,
    };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!panState.current || !viewportRef.current) return;
    viewportRef.current.scrollLeft = panState.current.scrollLeft - (e.clientX - panState.current.startX);
    viewportRef.current.scrollTop = panState.current.scrollTop - (e.clientY - panState.current.startY);
  }
  function handlePointerUp() {
    panState.current = null;
  }

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn("h-full overflow-auto p-12", tool === "pan" && "cursor-grab active:cursor-grabbing")}
    >
      <div className="flex justify-center" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
        <BlockContextMenu blockId={root.id} containerId={root.id} index={-1} isRoot>
          <div
            onClick={(e) => {
              e.stopPropagation();
              selectBlock(root.id);
            }}
            style={{
              width: 600,
              ...(emailHeight !== undefined
                ? { minHeight: CANVAS_EMAIL_HEIGHT_PX, height: emailHeight }
                : {}),
              display: "flex",
              flexDirection: "column",
              padding: sidesToCss(toSides(root.style.padding)),
              ...commonStyleToReactStyle(root.style),
            }}
            className={cn(
              "min-w-0 bg-white shadow-sm ring-1 ring-border",
              needsHeightFrame && "min-h-0",
              tool === "pan" && "pointer-events-none"
            )}
          >
            <StackChildren block={root} />
          </div>
        </BlockContextMenu>
      </div>
    </div>
  );
}
