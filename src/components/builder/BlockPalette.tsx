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

function PaletteItem({
  type,
  label,
  icon: Icon,
}: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
        "flex flex-col items-center gap-1.5 rounded-xl border border-input bg-card p-3 text-xs font-medium shadow-sm transition-colors",
        "hover:border-primary/60 hover:bg-muted hover:shadow-md",
        "active:border-primary active:bg-primary/15 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function BlockPalette() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.type} {...item} />
      ))}
    </div>
  );
}
