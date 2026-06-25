import { create } from "zustand";
import type { Block, BlockType, StackBlock } from "@/lib/types";
import { createBlock, cloneBlockWithNewIds, createRootBlock, ROOT_ID } from "@/lib/defaultBlocks";
import type { MergeTagProviderId } from "@/lib/mergeTags/types";
import { loadMergeTagProviderId, saveMergeTagProviderId } from "@/lib/mergeTags/providers";

export type TextEditorApi = {
  insertAtCursor: (text: string) => void;
  focus: () => void;
};

function findAndUpdate(blocks: Block[], id: string, updater: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    if (b.type === "stack") return { ...b, children: findAndUpdate(b.children, id, updater) };
    return b;
  });
}

function findAndRemove(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.type === "stack" ? { ...b, children: findAndRemove(b.children, id) } : b));
}

function insertInto(blocks: Block[], parentId: string | null, index: number, newBlock: Block): Block[] {
  if (parentId === null) {
    const next = [...blocks];
    next.splice(index, 0, newBlock);
    return next;
  }
  return blocks.map((b) => {
    if (b.id === parentId && b.type === "stack") {
      const children = [...b.children];
      children.splice(index, 0, newBlock);
      return { ...b, children };
    }
    if (b.type === "stack") return { ...b, children: insertInto(b.children, parentId, index, newBlock) };
    return b;
  });
}

function reorderArray(arr: Block[], activeId: string, overId: string): Block[] {
  const fromIndex = arr.findIndex((b) => b.id === activeId);
  const toIndex = arr.findIndex((b) => b.id === overId);
  if (fromIndex === -1 || toIndex === -1) return arr;
  const next = [...arr];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function reorderInContainer(blocks: Block[], containerId: string, activeId: string, overId: string): Block[] {
  if (containerId === ROOT_ID) return reorderArray(blocks, activeId, overId);
  return blocks.map((b) => {
    if (b.id === containerId && b.type === "stack") {
      return { ...b, children: reorderArray(b.children, activeId, overId) };
    }
    if (b.type === "stack") {
      return { ...b, children: reorderInContainer(b.children, containerId, activeId, overId) };
    }
    return b;
  });
}

function findInList(blocks: Block[], id: string): Block | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.type === "stack") {
      const found = findInList(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findBlock(root: StackBlock, id: string): Block | null {
  if (root.id === id) return root;
  return findInList(root.children, id);
}

export function getParentStack(root: StackBlock, blockId: string): StackBlock | null {
  if (blockId === root.id) return null;
  const loc = findContainerOf(root.children, blockId);
  if (!loc) return null;
  const parent = findBlock(root, loc.containerId);
  return parent?.type === "stack" ? parent : null;
}

// Locates which container (the root or a Stack's id) currently holds `id`,
// plus its index within that container's array — used by duplicate (insert
// right after the original, in the same container). Returns null for the
// root itself (it has no parent container).
function findContainerOf(
  blocks: Block[],
  id: string,
  containerId: string = ROOT_ID
): { containerId: string; index: number } | null {
  const index = blocks.findIndex((b) => b.id === id);
  if (index !== -1) return { containerId, index };
  for (const b of blocks) {
    if (b.type === "stack") {
      const found = findContainerOf(b.children, id, b.id);
      if (found) return found;
    }
  }
  return null;
}

// Recursive find-and-remove that also returns the removed block, so it can
// be reinserted elsewhere — the core of cross-container moves.
function extractBlock(blocks: Block[], id: string): { block: Block; rest: Block[] } | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.id === id) {
      return { block: b, rest: [...blocks.slice(0, i), ...blocks.slice(i + 1)] };
    }
    if (b.type === "stack") {
      const found = extractBlock(b.children, id);
      if (found) {
        const rest = blocks.map((x) => (x.id === b.id ? { ...b, children: found.rest } : x));
        return { block: found.block, rest };
      }
    }
  }
  return null;
}

function containsId(stack: StackBlock, id: string): boolean {
  return stack.children.some((c) => c.id === id || (c.type === "stack" && containsId(c, id)));
}

interface EditorState {
  templateId: string | null;
  name: string;
  root: StackBlock;
  selectedBlockId: string | null;
  clipboard: Block | null;
  dirty: boolean;
  mergeTagProvider: MergeTagProviderId;
  activeTextEditor: TextEditorApi | null;

  loadTemplate: (templateId: string, name: string, root: StackBlock) => void;
  setName: (name: string) => void;
  setMergeTagProvider: (id: MergeTagProviderId) => void;
  registerTextEditor: (api: TextEditorApi | null) => void;
  insertMergeTag: (tag: string) => void;
  addBlock: (type: BlockType, parentId?: string | null, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, partial: Partial<Block>) => void;
  reorderBlocks: (containerId: string, activeId: string, overId: string) => void;
  moveBlock: (blockId: string, targetContainerId: string, targetIndex: number) => void;
  selectBlock: (id: string | null) => void;
  markSaved: () => void;
  copyBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  pasteBlock: (containerId: string, index: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  templateId: null,
  name: "Untitled template",
  root: createRootBlock(),
  selectedBlockId: null,
  clipboard: null,
  dirty: false,
  mergeTagProvider: loadMergeTagProviderId(),
  activeTextEditor: null,

  loadTemplate: (templateId, name, root) =>
    set({ templateId, name, root, selectedBlockId: null, dirty: false }),

  setName: (name) => set({ name, dirty: true }),

  setMergeTagProvider: (id) => {
    saveMergeTagProviderId(id);
    set({ mergeTagProvider: id });
  },

  registerTextEditor: (api) => set({ activeTextEditor: api }),

  insertMergeTag: (tag) => {
    const { activeTextEditor, selectedBlockId, root } = useEditorStore.getState();
    if (activeTextEditor) {
      activeTextEditor.focus();
      activeTextEditor.insertAtCursor(tag);
      return;
    }
    if (!selectedBlockId) return;
    const block = findBlock(root, selectedBlockId);
    if (!block || block.type !== "text") return;
    const html = block.content.html;
    const closeIdx = html.lastIndexOf("</p>");
    const nextHtml =
      closeIdx === -1 ? `${html}${tag}` : `${html.slice(0, closeIdx)}${tag}${html.slice(closeIdx)}`;
    set((state) => ({
      root: {
        ...state.root,
        children: findAndUpdate(state.root.children, selectedBlockId, (b) => {
          if (b.type !== "text") return b;
          return { ...b, content: { html: nextHtml } };
        }),
      },
      dirty: true,
    }));
  },

  addBlock: (type, parentId = null, index = Number.MAX_SAFE_INTEGER) =>
    set((state) => {
      const block = createBlock(type);
      const targetParent = parentId === state.root.id ? null : parentId;
      const children = insertInto(state.root.children, targetParent, index, block);
      return { root: { ...state.root, children }, selectedBlockId: block.id, dirty: true };
    }),

  removeBlock: (id) =>
    set((state) => {
      if (id === state.root.id) return {};
      return {
        root: { ...state.root, children: findAndRemove(state.root.children, id) },
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        dirty: true,
      };
    }),

  updateBlock: (id, partial) =>
    set((state) => {
      if (id === state.root.id) {
        return { root: { ...state.root, ...partial } as StackBlock, dirty: true };
      }
      return {
        root: { ...state.root, children: findAndUpdate(state.root.children, id, (b) => ({ ...b, ...partial }) as Block) },
        dirty: true,
      };
    }),

  reorderBlocks: (containerId, activeId, overId) =>
    set((state) => ({
      root: { ...state.root, children: reorderInContainer(state.root.children, containerId, activeId, overId) },
      dirty: true,
    })),

  moveBlock: (blockId, targetContainerId, targetIndex) =>
    set((state) => {
      if (blockId === state.root.id || blockId === targetContainerId) return {};
      const extracted = extractBlock(state.root.children, blockId);
      if (!extracted) return {};
      const { block, rest } = extracted;
      if (block.type === "stack" && containsId(block, targetContainerId)) return {};
      const children =
        targetContainerId === state.root.id
          ? (() => {
              const c = [...rest];
              c.splice(targetIndex, 0, block);
              return c;
            })()
          : insertInto(rest, targetContainerId, targetIndex, block);
      return { root: { ...state.root, children }, dirty: true };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  markSaved: () => set({ dirty: false }),

  copyBlock: (id) =>
    set((state) => {
      const block = findBlock(state.root, id);
      return block ? { clipboard: block } : {};
    }),

  duplicateBlock: (id) =>
    set((state) => {
      const block = findBlock(state.root, id);
      const loc = findContainerOf(state.root.children, id);
      if (!block || !loc) return {};
      const clone = cloneBlockWithNewIds(block);
      const parentId = loc.containerId === state.root.id ? null : loc.containerId;
      const children = insertInto(state.root.children, parentId, loc.index + 1, clone);
      return { root: { ...state.root, children }, selectedBlockId: clone.id, dirty: true };
    }),

  pasteBlock: (containerId, index) =>
    set((state) => {
      if (!state.clipboard) return {};
      const clone = cloneBlockWithNewIds(state.clipboard);
      const parentId = containerId === state.root.id ? null : containerId;
      const children = insertInto(state.root.children, parentId, index, clone);
      return { root: { ...state.root, children }, selectedBlockId: clone.id, dirty: true };
    }),
}));

export function getSelectedBlock(): Block | null {
  const { root, selectedBlockId } = useEditorStore.getState();
  if (!selectedBlockId) return null;
  return findBlock(root, selectedBlockId);
}
