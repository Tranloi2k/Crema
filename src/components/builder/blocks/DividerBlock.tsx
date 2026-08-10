import type { DividerBlock as DividerBlockType } from "@/lib/types";
import { toSides, sidesToCss } from "@/lib/types";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";

export function DividerBlock({ block }: { block: DividerBlockType }) {
  return (
    <div style={{ padding: sidesToCss(toSides(block.style.padding)), ...commonStyleToReactStyle(block.style) }}>
      <hr
        style={{
          border: "none",
          borderTop: `${block.style.thickness}px ${block.style.lineStyle ?? "solid"} ${block.style.color}`,
          margin: 0,
        }}
      />
    </div>
  );
}
