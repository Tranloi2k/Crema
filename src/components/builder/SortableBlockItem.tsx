"use client";

import { useCallback, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Files, GripVertical, Trash2 } from "lucide-react";
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
  const copyBlock = useEditorStore((s) => s.copyBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { containerId } });

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
          "relative border border-transparent hover:border-primary/40",
          stretchWidth ? "w-full max-w-full min-w-0" : "w-auto max-w-full min-w-0",
          stretchHeight && "h-full min-h-0 self-stretch",
          flexHeight && "flex min-h-0 min-w-0 flex-col",
          flexHeight && !stretchHeight && "h-full flex-1",
          flexHeight && stretchHeight && "h-full w-full",
          isSelected && "border-primary",
          isDragging && "opacity-50",
          // Stack drop target: blue glow around the block
          indicator.showStackBorder && "ring-2 ring-primary ring-offset-1 rounded"
        )}
      >
        {isPrimary && !isDragging && (
          <div
            className="absolute right-1 top-1 z-30 flex items-center gap-0.5 rounded-lg border bg-background/95 p-0.5 text-muted-foreground shadow-md backdrop-blur"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              title="Move block (press Space to pick up)"
              aria-label="Move block"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {isSelected && (
              <>
                <button
                  type="button"
                  onClick={() => copyBlock(block.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Copy block"
                  aria-label="Copy block"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBlock(block.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Duplicate block"
                  aria-label="Duplicate block"
                >
                  <Files className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Delete block"
                  aria-label="Delete block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
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
