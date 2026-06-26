"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  ImageIcon,
  RectangleHorizontal,
  Minus,
  MoveVertical,
  Rows3,
  Share2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Block, StackBlock } from "@/lib/types";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { useEditorStore } from "@/lib/store/editorStore";
import { useDropIndicator } from "@/lib/hooks/useDropIndicator";
import { layerNestedPadding, layerRowPadding } from "@/lib/layers/indent";
import { BlockContextMenu } from "@/components/builder/BlockContextMenu";
import { cn } from "@/lib/utils";

const ICONS: Record<Block["type"], React.ComponentType<{ className?: string }>> = {
  text: Type,
  image: ImageIcon,
  button: RectangleHorizontal,
  divider: Minus,
  spacer: MoveVertical,
  stack: Rows3,
  social: Share2,
};

function labelFor(block: Block): string {
  if (block.name) return block.name;
  switch (block.type) {
    case "text": {
      const text = block.content.html.replace(/<[^>]+>/g, "").trim();
      return text || "Text";
    }
    case "image":
      return block.content.alt || "Image";
    case "button":
      return block.content.label || "Button";
    case "divider":
      return "Divider";
    case "spacer":
      return "Spacer";
    case "stack":
      return "Stack";
    case "social":
      return SOCIAL_PLATFORMS[block.content.platform]?.label ?? "Social";
  }
}

function LayerRow({
  block,
  depth,
  containerId,
  index,
  canDrag = true,
  isRoot = false,
}: {
  block: Block;
  depth: number;
  containerId: string;
  index: number;
  canDrag?: boolean;
  isRoot?: boolean;
}) {
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const toggleBlockSelection = useEditorStore((s) => s.toggleBlockSelection);
  const extendSelectionTo = useEditorStore((s) => s.extendSelectionTo);
  const [expanded, setExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { containerId },
    disabled: !canDrag,
  });

  const isStack = block.type === "stack";
  const isSelected = selectedBlockIds.includes(block.id);
  const Icon = ICONS[block.type];
  const indicator = useDropIndicator(block.id);

  const handleSelect = (e: React.MouseEvent) => {
    if (isRoot) {
      selectBlock(block.id);
      return;
    }
    if (e.shiftKey) extendSelectionTo(block.id);
    else if (e.ctrlKey || e.metaKey) toggleBlockSelection(block.id);
    else selectBlock(block.id);
  };

  return (
    <div className="relative">
      {indicator.showLineAbove && (
        <div className="pointer-events-none absolute -top-0.5 left-0 right-0 z-10 h-0.5 rounded bg-primary" />
      )}
      {indicator.showLineBelow && (
        <div className="pointer-events-none absolute -bottom-0.5 left-0 right-0 z-10 h-0.5 rounded bg-primary" />
      )}
      <BlockContextMenu
        blockId={block.id}
        containerId={containerId}
        index={index}
        isRoot={isRoot}
      >
        <div
          ref={setNodeRef}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
            paddingLeft: layerRowPadding(depth),
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(e);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            // Keep an existing multi-selection when right-clicking one of its rows.
            if (!selectedBlockIds.includes(block.id)) selectBlock(block.id);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded py-1.5 pr-2 text-xs transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted active:bg-muted/80",
            isDragging && "opacity-50",
            indicator.showStackBorder && "ring-2 ring-primary ring-inset"
          )}
        >
          {isStack ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <div
            ref={canDrag ? setActivatorNodeRef : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5",
              canDrag && "cursor-grab active:cursor-grabbing"
            )}
            {...(canDrag ? attributes : {})}
            {...(canDrag ? listeners : {})}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{labelFor(block)}</span>
          </div>
        </div>
      </BlockContextMenu>
      {isStack && expanded && <LayerStackChildren block={block} depth={depth + 1} />}
    </div>
  );
}

function LayerStackChildren({ block, depth }: { block: StackBlock; depth: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `layer-drop-${block.id}`,
    data: { containerId: block.id },
  });

  return (
    <div ref={setNodeRef} className={cn("rounded", isOver && "bg-primary/5")}>
      <SortableContext items={block.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {block.children.length === 0 ? (
          <p
            style={{ paddingLeft: layerNestedPadding(depth) }}
            className="py-1 text-[11px] text-muted-foreground/50"
          >
            Empty
          </p>
        ) : (
          block.children.map((child, index) => (
            <LayerRow
              key={child.id}
              block={child}
              depth={depth}
              containerId={block.id}
              index={index}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}

export function LayersPanel() {
  const root = useEditorStore((s) => s.root);

  return (
    <div className="p-2">
      <LayerRow
        block={root}
        depth={0}
        containerId={root.id}
        index={-1}
        canDrag={false}
        isRoot
      />
    </div>
  );
}
