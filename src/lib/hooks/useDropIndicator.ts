"use client";

import { useDndContext } from "@dnd-kit/core";
import { useEditorStore, findBlock, isAncestorBlock } from "@/lib/store/editorStore";
import { computeRowPlacement } from "@/lib/dnd/dropIntent";

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
  // Empty-stack drop zones: ring around the stack they belong to.
  if (overId === `stack-drop-${blockId}` || overId === `layer-drop-${blockId}`) {
    return { showStackBorder: true, showLineAbove: false, showLineBelow: false };
  }

  if (overId !== blockId) {
    return EMPTY;
  }

  const overBlock = findBlock(root, blockId);
  const activeId = String(active.id);
  const overIsStack =
    overBlock?.type === "stack" && !isAncestorBlock(root, activeId, blockId);

  const placement = computeRowPlacement(active, over, overIsStack);

  return {
    showStackBorder: placement === "inside",
    showLineAbove: placement === "before",
    showLineBelow: placement === "after",
  };
}
