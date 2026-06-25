import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import type { Block, StackBlock } from "@/lib/types";
import { findBlock } from "@/lib/store/editorStore";

const DROP_PREFIXES = ["stack-drop-", "layer-drop-"] as const;

function parseDroppableStackId(id: UniqueIdentifier): string | null {
  const str = String(id);
  for (const prefix of DROP_PREFIXES) {
    if (str.startsWith(prefix)) return str.slice(prefix.length);
  }
  return null;
}

function insertIndex(
  containerArr: Block[],
  overId: string,
  active: DragEndEvent["active"],
  over: NonNullable<DragEndEvent["over"]>
): number {
  const overIndex = containerArr.findIndex((b) => b.id === overId);
  if (overIndex === -1) return containerArr.length;

  const activeTop = active.rect.current.translated?.top ?? active.rect.current.initial?.top ?? 0;
  const overMid = over.rect.top + over.rect.height / 2;
  const insertAfter = activeTop > overMid;
  return insertAfter ? overIndex + 1 : overIndex;
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

  const droppableStackId = parseDroppableStackId(overId);
  if (droppableStackId) {
    const arr = getContainerArray(droppableStackId);
    return { containerId: droppableStackId, index: arr.length, appendIntoStack: true };
  }

  let overContainerId = (over.data.current as { containerId?: string } | undefined)?.containerId;
  if (!overContainerId) return null;

  const overBlock = findBlock(root, overId);
  let appendIntoStack = false;
  if (overBlock?.type === "stack" && overId !== String(active.id)) {
    overContainerId = overBlock.id;
    appendIntoStack = true;
  }

  const containerArr = getContainerArray(overContainerId);
  const index = appendIntoStack ? containerArr.length : insertIndex(containerArr, overId, active, over);

  return { containerId: overContainerId, index, appendIntoStack };
}
