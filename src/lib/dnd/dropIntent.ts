import type { Active, Over } from "@dnd-kit/core";

export type DropPlacement = "before" | "after" | "inside";

/** Vertical center of the dragged item (translated while dragging). */
function activeCenterY(active: Active): number {
  const rect = active.rect.current.translated ?? active.rect.current.initial;
  if (!rect) return 0;
  return rect.top + rect.height / 2;
}

/**
 * Decide where a drag lands relative to the block currently under the pointer.
 *
 * - Non-stack rows split 50/50 → reorder before/after as a sibling.
 * - Stack rows reserve a generous center band for "drop inside"; only the thin
 *   top/bottom edges reorder it as a sibling. This makes dropping a block into a
 *   stack (even a collapsed one) easy while keeping reorder reachable.
 */
export function computeRowPlacement(
  active: Active,
  over: Over,
  overIsStack: boolean
): DropPlacement {
  const center = activeCenterY(active);
  const top = over.rect.top;
  const height = over.rect.height;
  const bottom = top + height;

  if (overIsStack) {
    const edge = Math.min(height * 0.25, 12);
    if (center <= top + edge) return "before";
    if (center >= bottom - edge) return "after";
    return "inside";
  }

  return center < top + height / 2 ? "before" : "after";
}
