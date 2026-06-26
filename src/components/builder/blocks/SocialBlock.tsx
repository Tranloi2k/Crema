import type { SocialBlock as SocialBlockType } from "@/lib/types";
import { toDimension, dim, toSides, sidesToCss } from "@/lib/types";
import { isFillWidth, isPercentWidth } from "@/lib/layout/dimensions";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { imageToReactStyle } from "@/lib/export/imageStyle";
import { socialIconUrl, SOCIAL_PLATFORMS } from "@/lib/social";

function urlSize(w: number, h: number): number {
  const px = Math.max(w, h);
  return px > 0 ? Math.round(px * 2) : 64; // 2x for crisp rendering
}

export function SocialBlock({
  block,
  compactWidth = false,
}: {
  block: SocialBlockType;
  compactWidth?: boolean;
}) {
  const width = toDimension(block.style.width, dim(32));
  const height = toDimension(block.style.height, dim(32));
  const hugWidth = compactWidth || (!isFillWidth(width) && !isPercentWidth(width));
  const label = SOCIAL_PLATFORMS[block.content.platform]?.label ?? block.content.platform;
  const src = socialIconUrl(
    block.content.platform,
    block.style.iconColor,
    urlSize(width.unit === "px" ? width.value : 0, height.unit === "px" ? height.value : 0)
  );

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
        src={src}
        alt={label}
        style={imageToReactStyle(width, height, block.style.align)}
        data-resize-target={block.id}
      />
    </div>
  );
}
