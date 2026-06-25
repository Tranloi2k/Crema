import type { ImageBlock as ImageBlockType } from "@/lib/types";
import { toDimension, dim, toSides, sidesToCss } from "@/lib/types";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { imageToReactStyle } from "@/lib/export/imageStyle";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  const width = toDimension(block.style.width, dim(560));
  const height = toDimension(block.style.height, dim(0, "fit-content"));

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        textAlign: block.style.align,
        ...commonStyleToReactStyle(block.style),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.content.src}
        alt={block.content.alt}
        style={imageToReactStyle(width, height, block.style.align)}
      />
    </div>
  );
}
