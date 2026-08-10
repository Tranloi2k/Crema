import type { SocialBlock as SocialBlockType } from "@/lib/types";
import { toDimension, dim, toSides, sidesToCss } from "@/lib/types";
import { isFillWidth, isPercentWidth } from "@/lib/layout/dimensions";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { imageToReactStyle } from "@/lib/export/imageStyle";
import { getSocialItems, socialIconUrl, SOCIAL_PLATFORMS } from "@/lib/social";

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
  const items = getSocialItems(block.content);
  const groupAlign =
    block.style.align === "center"
      ? { marginLeft: "auto", marginRight: "auto" }
      : block.style.align === "right"
        ? { marginLeft: "auto" }
        : { marginRight: "auto" };

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        display: "flex",
        alignItems: "center",
        gap: block.style.gap ?? 8,
        ...(hugWidth ? { width: "fit-content", maxWidth: "100%", ...groupAlign } : {}),
        ...commonStyleToReactStyle(block.style),
      }}
    >
      {items.map((item, index) => {
        const label = SOCIAL_PLATFORMS[item.platform]?.label ?? item.platform;
        const src = socialIconUrl(
          item.platform,
          block.style.iconColor,
          urlSize(width.unit === "px" ? width.value : 0, height.unit === "px" ? height.value : 0),
        );
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`${item.platform}-${index}`}
            src={src}
            alt={label}
            style={imageToReactStyle(width, height, "left")}
            data-resize-target={index === 0 ? block.id : undefined}
          />
        );
      })}
    </div>
  );
}
