"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { blockUsesFlexHeight } from "@/lib/layout/dimensions";
import { useDropIndicator } from "@/lib/hooks/useDropIndicator";
import { BlockRenderer } from "@/components/builder/BlockRenderer";
import { BlockContextMenu } from "@/components/builder/BlockContextMenu";
import { cn } from "@/lib/utils";

export function SortableBlockItem({
  block,
  containerId,
  index,
  stretchWidth = true,
  compactWidth = false,
}: {
  block: Block;
  containerId: string;
  index: number;
  stretchWidth?: boolean;
  compactWidth?: boolean;
}) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { containerId },
  });

  const indicator = useDropIndicator(block.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedBlockId === block.id;
  const flexHeight = blockUsesFlexHeight(block);

  return (
    <BlockContextMenu blockId={block.id} containerId={containerId} index={index}>
      <div
        ref={setNodeRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
        className={cn(
          "relative cursor-grab border border-transparent hover:border-primary/40",
          stretchWidth ? "w-full" : "w-auto max-w-full",
          flexHeight && "flex h-full min-h-0 flex-1 flex-col",
          isSelected && "border-primary",
          isDragging && "cursor-grabbing opacity-50",
          // Stack drop target: blue glow around the block
          indicator.showStackBorder && "ring-2 ring-primary ring-offset-1 rounded"
        )}
        {...attributes}
        {...listeners}
      >
        {/* Sibling-reorder drop indicators: blue line above or below */}
        {indicator.showLineAbove && (
          <div className="pointer-events-none absolute -top-0.5 left-0 right-0 z-10 h-1 rounded bg-primary" />
        )}
        {indicator.showLineBelow && (
          <div className="pointer-events-none absolute -bottom-0.5 left-0 right-0 z-10 h-1 rounded bg-primary" />
        )}
        <BlockRenderer block={block} compactWidth={compactWidth} />
      </div>
    </BlockContextMenu>
  );
}
