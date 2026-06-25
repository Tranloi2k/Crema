import type { ButtonBlock as ButtonBlockType } from "@/lib/types";
import { toSides, sidesToCss } from "@/lib/types";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";

export function ButtonBlock({ block }: { block: ButtonBlockType }) {
  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        textAlign: block.style.align,
        ...commonStyleToReactStyle(block.style),
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "10px 20px",
          backgroundColor: block.style.bgColor,
          color: block.style.textColor,
          borderRadius: block.style.borderRadius,
          fontSize: 14,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {block.content.label}
      </span>
    </div>
  );
}
