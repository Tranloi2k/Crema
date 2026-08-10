"use client";

import { useEffect, useRef } from "react";
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

export function Canvas({
  root,
  zoom,
  tool,
  onInitialFit,
}: {
  root: StackBlock;
  zoom: number;
  tool: Tool;
  onInitialFit?: (zoom: number) => void;
}) {
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
  const fitInitializedRef = useRef(false);
  const panState = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || fitInitializedRef.current || !onInitialFit) return;
    const observer = new ResizeObserver(([entry]) => {
      if (fitInitializedRef.current) return;
      fitInitializedRef.current = true;
      const width = entry.contentRect.width;
      if (width < 768) {
        const fittedZoom = Math.max(0.4, Math.min(0.9, (width - 24) / 600));
        onInitialFit(Math.round(fittedZoom * 100) / 100);
      }
      observer.disconnect();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [onInitialFit]);

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
      className={cn("relative h-full overflow-auto px-3 pb-24 pt-14 sm:px-6 sm:pt-16 lg:px-12", tool === "pan" && "cursor-grab active:cursor-grabbing")}
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--muted-foreground) / 0.16) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
        Email canvas · 600 px
      </div>
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
              "relative min-w-0 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/10",
              needsHeightFrame && "min-h-0",
              tool === "pan" && "pointer-events-none"
            )}
          >
            <StackChildren block={root} isRoot />
          </div>
        </BlockContextMenu>
      </div>
    </div>
  );
}
