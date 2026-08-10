"use client";

import { useState, type ComponentType } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  ImageIcon,
  Minus,
  MoveVertical,
  RectangleHorizontal,
  Rows3,
  Search,
  Share2,
  Type,
} from "lucide-react";
import type { BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PALETTE_ITEMS: {
  type: BlockType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  category: string;
  description: string;
}[] = [
  { type: "text", label: "Text", icon: Type, category: "Content", description: "Heading or paragraph" },
  { type: "image", label: "Image", icon: ImageIcon, category: "Content", description: "Photo or graphic" },
  { type: "social", label: "Social links", icon: Share2, category: "Content", description: "A group of social icons" },
  { type: "button", label: "Button", icon: RectangleHorizontal, category: "Actions", description: "Call-to-action link" },
  { type: "divider", label: "Divider", icon: Minus, category: "Structure", description: "Separate sections" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, category: "Structure", description: "Add breathing room" },
  { type: "stack", label: "Layout", icon: Rows3, category: "Structure", description: "Arrange content vertically or side-by-side" },
];

const PALETTE_META = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.type, item]),
) as Record<BlockType, (typeof PALETTE_ITEMS)[number]>;

export function PaletteDragGhost({ type }: { type: BlockType }) {
  const meta = PALETTE_META[type];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="pointer-events-none flex items-center gap-2 rounded-xl border border-primary bg-card px-3 py-2 text-xs font-medium text-foreground shadow-xl">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {meta.label}
    </div>
  );
}

function PaletteItem({
  type,
  label,
  icon: Icon,
  description,
  onBlockAdded,
}: (typeof PALETTE_ITEMS)[number] & { onBlockAdded?: () => void }) {
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
      type="button"
      onClick={() => {
        addBlock(type);
        onBlockAdded?.();
      }}
      title={`Add ${label.toLowerCase()} block`}
      className={cn(
        "group flex min-h-[4.5rem] w-full items-center gap-3 rounded-xl border border-border/80 bg-card p-3 text-left shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md",
        "active:translate-y-0 active:border-primary active:bg-primary/10 active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "opacity-40",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

export function BlockPalette({ onBlockAdded }: { onBlockAdded?: () => void }) {
  const [filter, setFilter] = useState("");
  const normalizedFilter = filter.trim().toLowerCase();

  const groups = PALETTE_ITEMS.reduce<Record<string, typeof PALETTE_ITEMS>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const hasResults = PALETTE_ITEMS.some(
    (item) =>
      item.label.toLowerCase().includes(normalizedFilter) ||
      item.description.toLowerCase().includes(normalizedFilter),
  );

  return (
    <div className="p-3">
      <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Add one block at a time
      </div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search blocks..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-9 w-full bg-muted/40 pl-8 text-xs"
          aria-label="Search blocks"
        />
      </div>

      {!hasResults && (
        <div className="rounded-xl border border-dashed p-5 text-center">
          <p className="text-xs font-medium text-foreground">No blocks found</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Try a different search.</p>
        </div>
      )}

      {Object.entries(groups).map(([category, items]) => {
        const visible = items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedFilter) ||
            item.description.toLowerCase().includes(normalizedFilter),
        );
        if (visible.length === 0) return null;
        return (
          <section key={category} className="mb-5 last:mb-1">
            <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h3>
            <div className="grid gap-2">
              {visible.map((item) => (
                <PaletteItem key={item.type} {...item} onBlockAdded={onBlockAdded} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
