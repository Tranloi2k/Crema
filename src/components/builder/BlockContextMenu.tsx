"use client";

import * as ContextMenu from "@radix-ui/react-context-menu";
import { Copy, Files, ClipboardPaste, Trash2, Group } from "lucide-react";
import { useEditorStore } from "@/lib/store/editorStore";

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function BlockContextMenu({
  blockId,
  containerId,
  index,
  isRoot = false,
  children,
}: {
  blockId: string;
  containerId: string;
  index: number;
  isRoot?: boolean;
  children: React.ReactNode;
}) {
  const clipboard = useEditorStore((s) => s.clipboard);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);
  const copyBlock = useEditorStore((s) => s.copyBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const pasteBlock = useEditorStore((s) => s.pasteBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const wrapInStack = useEditorStore((s) => s.wrapInStack);

  // When right-clicking a row that's part of a multi-selection, act on the
  // whole selection; otherwise act on just this block.
  const targets =
    selectedBlockIds.length > 1 && selectedBlockIds.includes(blockId)
      ? selectedBlockIds
      : [blockId];
  const isMulti = targets.length > 1;

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {!isMulti && (
            <ContextMenu.Item className={itemClass} onSelect={() => copyBlock(blockId)}>
              <Copy className="h-4 w-4" /> Copy
            </ContextMenu.Item>
          )}
          {!isRoot && !isMulti && (
            <ContextMenu.Item className={itemClass} onSelect={() => duplicateBlock(blockId)}>
              <Files className="h-4 w-4" /> Duplicate
            </ContextMenu.Item>
          )}
          {!isMulti && (
            <ContextMenu.Item
              className={itemClass}
              disabled={!clipboard}
              onSelect={() => (isRoot ? pasteBlock(blockId, 0) : pasteBlock(containerId, index + 1))}
            >
              <ClipboardPaste className="h-4 w-4" /> Paste
            </ContextMenu.Item>
          )}
          {!isRoot && (
            <ContextMenu.Item className={itemClass} onSelect={() => wrapInStack(targets)}>
              <Group className="h-4 w-4" />
              {isMulti ? `Wrap ${targets.length} in Stack` : "Wrap in Stack"}
            </ContextMenu.Item>
          )}
          {!isRoot && (
            <>
              <ContextMenu.Separator className="my-1 h-px bg-border" />
              <ContextMenu.Item
                className={`${itemClass} text-destructive hover:text-destructive`}
                onSelect={() => (isMulti ? removeBlocks(targets) : removeBlock(blockId))}
              >
                <Trash2 className="h-4 w-4" />
                {isMulti ? `Delete ${targets.length} blocks` : "Delete"}
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
