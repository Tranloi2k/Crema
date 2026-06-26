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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.content.src}
        alt={block.content.alt}
        style={imageToReactStyle(width, height, block.style.align)}
        data-resize-target={block.id}
      />
    </div>
  );
}
