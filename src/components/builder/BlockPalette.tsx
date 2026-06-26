"use client";

import { useDraggable } from "@dnd-kit/core";
import { Type, ImageIcon, RectangleHorizontal, Minus, MoveVertical, Rows3 } from "lucide-react";
import type { BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { cn } from "@/lib/utils";

const PALETTE_ITEMS: { type: BlockType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: RectangleHorizontal },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "stack", label: "Stack", icon: Rows3 },
];

const PALETTE_META = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.type, item])
) as Record<BlockType, (typeof PALETTE_ITEMS)[number]>;

/** Floating chip rendered inside the DndContext DragOverlay while a palette
 *  block is being dragged onto the canvas. */
export function PaletteDragGhost({ type }: { type: BlockType }) {
  const meta = PALETTE_META[type];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="pointer-events-none flex items-center gap-1.5 rounded-lg border border-primary bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg">
      <Icon className="h-4 w-4" />
      {meta.label}
    </div>
  );
}

function PaletteItem({
  type,
  label,
  icon: Icon,
  orientation,
}: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  orientation: "grid" | "bar";
}) {
  const addBlock = useEditorStore((s) => s.addBlock);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => addBlock(type)}
      className={cn(
        "flex items-center font-medium border border-input bg-card text-xs shadow-sm transition-colors",
        "hover:border-primary/60 hover:bg-muted hover:shadow-md",
        "active:border-primary active:bg-primary/15 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        orientation === "grid"
          ? "flex-col justify-center gap-1.5 rounded-xl p-3"
          : "shrink-0 gap-1.5 rounded-lg px-3 py-1.5",
        isDragging && "opacity-50"
      )}
    >
      <Icon className={orientation === "grid" ? "h-5 w-5" : "h-4 w-4"} />
      {label}
    </button>
  );
}

export function BlockPalette() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.type} orientation="grid" {...item} />
      ))}
    </div>
  );
}

/** Horizontal block palette — sits as a bar above the canvas. */
export function BlockPaletteBar() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-muted/40 px-4 py-2">
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.type} orientation="bar" {...item} />
      ))}
    </div>
  );
}
