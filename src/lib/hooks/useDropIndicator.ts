"use client";

import { useDndContext } from "@dnd-kit/core";
import { useEditorStore, findBlock } from "@/lib/store/editorStore";

export interface DropIndicator {
  /** Show a blue ring around the whole block (used for Stack drop targets). */
  showStackBorder: boolean;
  /** Show a horizontal blue line at the top edge — drop will land *above* this block. */
  showLineAbove: boolean;
  /** Show a horizontal blue line at the bottom edge — drop will land *below* this block. */
  showLineBelow: boolean;
}

const EMPTY: DropIndicator = { showStackBorder: false, showLineAbove: false, showLineBelow: false };

// Reads the current dnd-kit drag state and computes visual hints for the
// block at `blockId`: blue ring if the user is dropping *into* this Stack,
// or a blue line above/below if the user is reordering siblings around it.
export function useDropIndicator(blockId: string): DropIndicator {
  const { over, active } = useDndContext();
  const root = useEditorStore((s) => s.root);

  if (!over || !active || active.id === blockId) {
    return EMPTY;
  }

  const overId = String(over.id);
  if (overId === `stack-drop-${blockId}` || overId === `layer-drop-${blockId}`) {
    return { showStackBorder: true, showLineAbove: false, showLineBelow: false };
  }

  if (overId !== blockId) {
    return EMPTY;
  }

  const overBlock = findBlock(root, blockId);
  if (overBlock?.type === "stack") {
    return { showStackBorder: true, showLineAbove: false, showLineBelow: false };
  }

  // Sibling reorder/insert: position the line based on whether the dragged
  // item is currently above or below the over item. Falls back to "above" if
  // rect info isn't available yet (very start of drag).
  const activeTop = active.rect.current?.translated?.top ?? 0;
  const overRect = over.rect;
  const overMid = overRect.top + overRect.height / 2;
  const above = activeTop < overMid;
  return {
    showStackBorder: false,
    showLineAbove: above,
    showLineBelow: !above,
  };
}
