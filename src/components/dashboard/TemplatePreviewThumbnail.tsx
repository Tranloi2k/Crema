"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { blocksToHtml } from "@/lib/export/toHtml";
import { normalizeRoot } from "@/lib/defaultBlocks";
import { CANVAS_EMAIL_WIDTH_PX } from "@/lib/layout/convertDimension";
import { dim, toDimension } from "@/lib/types";
import type { StackBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

const PREVIEW_PADDING_PX = 14;
const FALLBACK_FRAME_HEIGHT = 600;

function getRootFrameSize(root: StackBlock) {
  const widthDim = toDimension(root.style.width, dim(CANVAS_EMAIL_WIDTH_PX, "px"));
  const heightDim = toDimension(root.style.height, dim(0, "fit-content"));

  const width =
    widthDim.unit === "px" && widthDim.value > 0 ? widthDim.value : CANVAS_EMAIL_WIDTH_PX;

  let height: number | null = null;
  if (heightDim.unit === "px" && heightDim.value > 0) {
    height = heightDim.value;
  }

  return { width, height };
}

export function TemplatePreviewThumbnail({
  content,
  className,
}: {
  content: unknown;
  className?: string;
}) {
  const root = useMemo(() => normalizeRoot(content), [content]);
  const frame = useMemo(() => getRootFrameSize(root), [root]);
  const srcDoc = useMemo(() => blocksToHtml(root, { width: frame.width }), [root, frame.width]);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.4);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const frameHeight = frame.height ?? contentHeight ?? FALLBACK_FRAME_HEIGHT;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width <= 0 || height <= 0) return;

      const innerW = width - PREVIEW_PADDING_PX * 2;
      const innerH = height - PREVIEW_PADDING_PX * 2;
      const next = Math.min(innerW / frame.width, innerH / frameHeight);
      if (next > 0) setScale(next);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frame.width, frameHeight]);

  const syncHeight = useCallback(() => {
    if (frame.height != null) return;

    const doc = iframeRef.current?.contentDocument;
    const email = doc?.getElementById("crema-email");
    if (!email) return;

    const measured = Math.ceil(email.getBoundingClientRect().height);
    if (measured > 0) setContentHeight(measured);
  }, [frame.height]);

  useEffect(() => {
    setContentHeight(null);
    const timer = window.setTimeout(syncHeight, 0);
    return () => window.clearTimeout(timer);
  }, [srcDoc, syncHeight]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden bg-[#e8e8ec]", className)}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/5"
        style={{
          width: frame.width,
          height: frameHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <iframe
          ref={iframeRef}
          title="Template preview"
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          scrolling="no"
          onLoad={syncHeight}
          className="block h-full w-full border-0 bg-white"
          style={{ width: frame.width, height: frameHeight }}
        />
      </div>
    </div>
  );
}
