"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  ImageIcon,
  RectangleHorizontal,
  Minus,
  MoveVertical,
  Rows3,
  Eye,
  Send,
} from "lucide-react";
import type { BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { blocksToHtml } from "@/lib/export/toHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PALETTE_ITEMS: {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: RectangleHorizontal },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "stack", label: "Stack", icon: Rows3 },
];

const PALETTE_META = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.type, item]),
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
        isDragging && "opacity-50",
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

/** Horizontal block palette — full-width bar above the editor columns. */
export function BlockPaletteBar({
  onPreview,
  readOnly = false,
}: {
  onPreview: () => void;
  readOnly?: boolean;
}) {
  const name = useEditorStore((s) => s.name);
  const root = useEditorStore((s) => s.root);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  async function handleSendTest() {
    if (!testEmail) return;
    setSending(true);
    try {
      await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail, html: blocksToHtml(root), subject: name }),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 overflow-x-auto border-b border-border/60 bg-background px-4 py-2">
      {!readOnly && (
        <div className="flex items-center gap-2">
          {PALETTE_ITEMS.map((item) => (
            <PaletteItem key={item.type} orientation="bar" {...item} />
          ))}
        </div>
      )}
      <div className={cn("flex shrink-0 items-center gap-2", readOnly && "ml-auto")}>
        {!readOnly && (
          <>
            <Input
              placeholder="test@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-8 w-44 rounded-full"
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleSendTest}
              disabled={sending}
            >
              <Send className="mr-1.5 h-4 w-4" /> Send test
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" className="rounded-full" onClick={onPreview}>
          <Eye className="mr-1.5 h-4 w-4" /> Preview
        </Button>
      </div>
    </div>
  );
}
