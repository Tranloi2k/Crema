"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { ImageBlock as ImageBlockType } from "@/lib/types";
import { toDimension, dim, toSides, sidesToCss } from "@/lib/types";
import { isFillWidth, isPercentWidth } from "@/lib/layout/dimensions";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { imageToReactStyle } from "@/lib/export/imageStyle";

export function ImageBlock({
  block,
  compactWidth = false,
}: {
  block: ImageBlockType;
  compactWidth?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const width = toDimension(block.style.width, dim(560));
  const height = toDimension(block.style.height, dim(0, "fit-content"));
  const hugWidth =
    compactWidth || (!isFillWidth(width) && !isPercentWidth(width));

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        textAlign: block.style.align,
        ...(hugWidth ? { width: "fit-content", maxWidth: "100%" } : {}),
        ...commonStyleToReactStyle(block.style),
      }}
    >
      {!block.content.src.trim() || failedSrc === block.content.src ? (
        <div
          className="flex min-h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-4 text-center text-muted-foreground"
          style={imageToReactStyle(width, height, block.style.align)}
          data-resize-target={block.id}
        >
          <ImageOff className="mb-2 h-5 w-5" />
          <span className="text-xs font-medium">Image unavailable</span>
          <span className="mt-1 text-[10px]">Choose a file or check the image URL.</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={block.content.src}
          alt={block.content.alt}
          style={imageToReactStyle(width, height, block.style.align)}
          data-resize-target={block.id}
          onError={() => setFailedSrc(block.content.src)}
        />
      )}
    </div>
  );
}
