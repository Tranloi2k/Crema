import type { ButtonBlock as ButtonBlockType } from "@/lib/types";
import { toSides, sidesToCss, toDimension, dim } from "@/lib/types";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { buttonToReactStyle, buttonWrapperStyle } from "@/lib/export/buttonStyle";

export function ButtonBlock({ block }: { block: ButtonBlockType }) {
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const height = toDimension(block.style.height, dim(0, "fit-content"));
  const colors = {
    bgColor: block.style.bgColor,
    textColor: block.style.textColor,
    borderRadius: block.style.borderRadius,
  };

  const linkStyle = buttonToReactStyle(width, height, block.style.align, colors);
  const href = block.content.href?.trim();

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        ...buttonWrapperStyle(block.style.align, width, height),
        // Button color lives on the <a>; never paint it on the full-width wrapper.
        ...commonStyleToReactStyle(block.style, { skipBackground: true }),
      }}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
          data-resize-target={block.id}
          onClick={(e) => e.preventDefault()}
        >
          {block.content.label}
        </a>
      ) : (
        <span style={linkStyle} data-resize-target={block.id}>
          {block.content.label}
        </span>
      )}
    </div>
  );
}
