"use client";

import { useCallback, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { blockUsesFlexHeight } from "@/lib/layout/dimensions";
import { useDropIndicator } from "@/lib/hooks/useDropIndicator";
import { BlockRenderer } from "@/components/builder/BlockRenderer";
import { BlockContextMenu } from "@/components/builder/BlockContextMenu";
import { BlockResizer } from "@/components/builder/BlockResizer";
import { cn } from "@/lib/utils";

export function SortableBlockItem({
  block,
  containerId,
  index,
  stretchWidth = true,
  stretchHeight = false,
  compactWidth = false,
}: {
  block: Block;
  containerId: string;
  index: number;
  stretchWidth?: boolean;
  stretchHeight?: boolean;
  compactWidth?: boolean;
}) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const toggleBlockSelection = useEditorStore((s) => s.toggleBlockSelection);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { containerId },
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      containerRef.current = node;
    },
    [setNodeRef]
  );
  const indicator = useDropIndicator(block.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedBlockIds.includes(block.id);
  const isPrimary = selectedBlockId === block.id && selectedBlockIds.length === 1;
  const flexHeight = blockUsesFlexHeight(block);

  return (
    <BlockContextMenu blockId={block.id} containerId={containerId} index={index}>
      <div
        ref={setRefs}
        data-block-id={block.id}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) toggleBlockSelection(block.id);
          else selectBlock(block.id);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (!selectedBlockIds.includes(block.id)) selectBlock(block.id);
        }}
        className={cn(
          "relative cursor-grab border border-transparent hover:border-primary/40",
          stretchWidth ? "w-full max-w-full min-w-0" : "w-auto max-w-full min-w-0",
          stretchHeight && "h-full min-h-0 self-stretch",
          flexHeight && "flex min-h-0 min-w-0 flex-col",
          flexHeight && !stretchHeight && "h-full flex-1",
          flexHeight && stretchHeight && "h-full w-full",
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
        <BlockRenderer
          block={block}
          compactWidth={compactWidth}
          crossAxisFill={stretchHeight}
        />
        {isPrimary && !isDragging && <BlockResizer block={block} containerRef={containerRef} />}
      </div>
    </BlockContextMenu>
  );
}
