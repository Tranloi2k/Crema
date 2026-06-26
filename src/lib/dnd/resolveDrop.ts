import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import type { Block, StackBlock } from "@/lib/types";
import { findBlock, getParentStack, isAncestorBlock } from "@/lib/store/editorStore";
import { computeRowPlacement, type DropPlacement } from "@/lib/dnd/dropIntent";

const DROP_PREFIXES = ["stack-drop-", "layer-drop-"] as const;

function parseDroppableStackId(id: UniqueIdentifier): string | null {
  const str = String(id);
  for (const prefix of DROP_PREFIXES) {
    if (str.startsWith(prefix)) return str.slice(prefix.length);
  }
  return null;
}

function insertIndexByPlacement(
  containerArr: Block[],
  overId: string,
  placement: DropPlacement
): number {
  const overIndex = containerArr.findIndex((b) => b.id === overId);
  if (overIndex === -1) return containerArr.length;
  return placement === "after" ? overIndex + 1 : overIndex;
}

export interface DropTarget {
  containerId: string;
  /** Insert position for palette adds and cross-container moves. */
  index: number;
  /** Drop landed on a Stack row / empty droppable — append inside. */
  appendIntoStack: boolean;
}

export function resolveDropTarget(
  event: DragEndEvent,
  root: StackBlock,
  getContainerArray: (containerId: string) => Block[]
): DropTarget | null {
  const { active, over } = event;
  if (!over) return null;

  const overId = String(over.id);
  const activeId = String(active.id);

  // Empty-stack drop zones → always append inside that stack.
  const droppableStackId = parseDroppableStackId(overId);
  if (droppableStackId) {
    const arr = getContainerArray(droppableStackId);
    return { containerId: droppableStackId, index: arr.length, appendIntoStack: true };
  }

  const overContainerId = (over.data.current as { containerId?: string } | undefined)?.containerId;
  if (!overContainerId) return null;

  const overBlock = findBlock(root, overId);
  // A stack row offers a center "drop inside" band — unless it's the dragged
  // block itself or one of its descendants (which would be an invalid move).
  const overIsStack =
    overBlock?.type === "stack" &&
    overId !== activeId &&
    !isAncestorBlock(root, activeId, overId);

  const placement = computeRowPlacement(active, over, overIsStack);

  // Drop inside the hovered stack (append to its children).
  if (placement === "inside" && overBlock?.type === "stack") {
    const arr = getContainerArray(overId);
    return { containerId: overId, index: arr.length, appendIntoStack: true };
  }

  // Sibling reorder: stack rows reorder at their parent level; everything else
  // reorders within the container that owns the hovered block.
  let containerId = overContainerId;
  if (overBlock?.type === "stack") {
    const parent = getParentStack(root, overId);
    if (!parent) return null;
    containerId = parent.id;
  }

  const containerArr = getContainerArray(containerId);
  const index = insertIndexByPlacement(containerArr, overId, placement);

  return { containerId, index, appendIntoStack: false };
}
