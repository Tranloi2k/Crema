import type { SpacerBlock as SpacerBlockType } from "@/lib/types";
import { toDimension, dim, dimToCss } from "@/lib/types";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";

export function SpacerBlock({ block }: { block: SpacerBlockType }) {
  const height = toDimension(block.style.height, dim(24));

  return (
    <div
      style={{ height: dimToCss(height), ...commonStyleToReactStyle(block.style) }}
      className="flex items-center justify-center text-[10px] text-muted-foreground/50"
      data-resize-target={block.id}
    >
      spacer
    </div>
  );
}
