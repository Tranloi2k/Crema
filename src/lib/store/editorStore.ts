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

/** Direct children array of a container (root or a Stack), or null. */
function getContainerChildren(root: StackBlock, containerId: string): Block[] | null {
  if (containerId === root.id) return root.children;
  const block = findBlock(root, containerId);
  return block?.type === "stack" ? block.children : null;
}

function removeManyFromList(blocks: Block[], ids: Set<string>): Block[] {
  return blocks
    .filter((b) => !ids.has(b.id))
    .map((b) => (b.type === "stack" ? { ...b, children: removeManyFromList(b.children, ids) } : b));
}

/** True when `nodeId` is `ancestorId` itself or lives somewhere inside its subtree. */
export function isAncestorBlock(root: StackBlock, ancestorId: string, nodeId: string): boolean {
  if (ancestorId === nodeId) return true;
  const ancestor = findBlock(root, ancestorId);
  return ancestor?.type === "stack" ? containsId(ancestor, nodeId) : false;
}

const HISTORY_LIMIT = 100;
const COALESCE_MS = 600;

interface EditorState {
  templateId: string | null;
  name: string;
  root: StackBlock;
  /** Primary selection — drives the properties panel and on-canvas resize handles. */
  selectedBlockId: string | null;
  /** Full selection set (multi-select in the Layers panel). Always includes the primary. */
  selectedBlockIds: string[];
  clipboard: Block | null;
  dirty: boolean;
  mergeTagProvider: MergeTagProviderId;
  activeTextEditor: TextEditorApi | null;
  /** Canvas zoom factor — read by on-canvas overlays (e.g. resize handles). */
  zoom: number;
  /** Undo/redo stacks of full root snapshots. */
  past: StackBlock[];
  future: StackBlock[];
  /** Internal coalescing markers so rapid edits collapse into one undo step. */
  _histKey: string | null;
  _histTime: number;

  setZoom: (zoom: number) => void;
  loadTemplate: (templateId: string, name: string, root: StackBlock) => void;
  /** Replaces the canvas with a restored version's content (kept dirty + undoable). */
  loadVersion: (root: StackBlock, name?: string) => void;
  setName: (name: string) => void;
  setMergeTagProvider: (id: MergeTagProviderId) => void;
  registerTextEditor: (api: TextEditorApi | null) => void;
  insertMergeTag: (tag: string) => void;
  addBlock: (type: BlockType, parentId?: string | null, index?: number) => void;
  addSection: (section: StackBlock) => void;
  removeBlock: (id: string) => void;
  removeBlocks: (ids: string[]) => void;
  wrapInStack: (ids: string[]) => void;
  updateBlock: (id: string, partial: Partial<Block>) => void;
  reorderBlocks: (containerId: string, activeId: string, overId: string) => void;
  moveBlock: (blockId: string, targetContainerId: string, targetIndex: number) => void;
  selectBlock: (id: string | null) => void;
  toggleBlockSelection: (id: string) => void;
  extendSelectionTo: (id: string) => void;
  markSaved: () => void;
  copyBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  pasteBlock: (containerId: string, index: number) => void;
  undo: () => void;
  redo: () => void;
}

/**
 * Builds the history slice for a mutating action: snapshots the current root
 * onto the undo stack and clears redo. Pass a `coalesceKey` for high-frequency
 * edits (typing, dragging) so a rapid burst collapses into a single undo step.
 */
function history(
  state: EditorState,
  coalesceKey: string | null = null
): Pick<EditorState, "past" | "future" | "_histKey" | "_histTime"> {
  const now = Date.now();
  const coalesce =
    coalesceKey !== null && state._histKey === coalesceKey && now - state._histTime < COALESCE_MS;
  return {
    past: coalesce ? state.past : [...state.past, state.root].slice(-HISTORY_LIMIT),
    future: [],
    _histKey: coalesceKey,
    _histTime: now,
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  templateId: null,
  name: "Untitled template",
  root: createRootBlock(),
  selectedBlockId: null,
  selectedBlockIds: [],
  clipboard: null,
  dirty: false,
  mergeTagProvider: loadMergeTagProviderId(),
  activeTextEditor: null,
  zoom: 1,
  past: [],
  future: [],
  _histKey: null,
  _histTime: 0,

  setZoom: (zoom) => set({ zoom }),

  loadTemplate: (templateId, name, root) =>
    set({
      templateId,
      name,
      root,
      selectedBlockId: null,
      selectedBlockIds: [],
      dirty: false,
      past: [],
      future: [],
      _histKey: null,
      _histTime: 0,
    }),

  loadVersion: (root, name) =>
    set((state) => ({
      ...history(state),
      root,
      name: name ?? state.name,
      selectedBlockId: null,
      selectedBlockIds: [],
      dirty: true,
    })),

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
      ...history(state, `merge-tag:${selectedBlockId}`),
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
      return {
        ...history(state),
        root: { ...state.root, children },
        selectedBlockId: block.id,
        selectedBlockIds: [block.id],
        dirty: true,
      };
    }),

  addSection: (section) =>
    set((state) => ({
      ...history(state),
      root: { ...state.root, children: [...state.root.children, section] },
      selectedBlockId: section.id,
      selectedBlockIds: [section.id],
      dirty: true,
    })),

  removeBlock: (id) =>
    set((state) => {
      if (id === state.root.id) return {};
      return {
        ...history(state),
        root: { ...state.root, children: findAndRemove(state.root.children, id) },
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        selectedBlockIds: state.selectedBlockIds.filter((x) => x !== id),
        dirty: true,
      };
    }),

  removeBlocks: (ids) =>
    set((state) => {
      const idSet = new Set(ids.filter((id) => id !== state.root.id));
      if (idSet.size === 0) return {};
      return {
        ...history(state),
        root: { ...state.root, children: removeManyFromList(state.root.children, idSet) },
        selectedBlockId:
          state.selectedBlockId && idSet.has(state.selectedBlockId) ? null : state.selectedBlockId,
        selectedBlockIds: state.selectedBlockIds.filter((x) => !idSet.has(x)),
        dirty: true,
      };
    }),

  wrapInStack: (ids) =>
    set((state) => {
      const unique = Array.from(new Set(ids)).filter((id) => id !== state.root.id);
      if (unique.length === 0) return {};

      const locs = unique.map((id) => findContainerOf(state.root.children, id));
      if (locs.some((l) => l === null)) return {};
      const containerId = locs[0]!.containerId;
      if (!locs.every((l) => l!.containerId === containerId)) return {};

      const containerArr = getContainerChildren(state.root, containerId);
      if (!containerArr) return {};

      const idSet = new Set(unique);
      const selected = containerArr.filter((b) => idSet.has(b.id));
      if (selected.length === 0) return {};

      const newStack = createBlock("stack") as StackBlock;
      const stack: StackBlock = { ...newStack, children: selected };

      const insertPos = containerArr.findIndex((b) => idSet.has(b.id));
      const remaining = containerArr.filter((b) => !idSet.has(b.id));
      remaining.splice(insertPos, 0, stack);

      const rebuild = (blocks: Block[], curContainerId: string): Block[] => {
        if (curContainerId === containerId) return remaining;
        return blocks.map((b) =>
          b.type === "stack" ? { ...b, children: rebuild(b.children, b.id) } : b
        );
      };

      const children =
        containerId === state.root.id ? remaining : rebuild(state.root.children, state.root.id);

      return {
        ...history(state),
        root: { ...state.root, children },
        selectedBlockId: stack.id,
        selectedBlockIds: [stack.id],
        dirty: true,
      };
    }),

  updateBlock: (id, partial) =>
    set((state) => {
      const hist = history(state, `update:${id}`);
      if (id === state.root.id) {
        return { ...hist, root: { ...state.root, ...partial } as StackBlock, dirty: true };
      }
      return {
        ...hist,
        root: { ...state.root, children: findAndUpdate(state.root.children, id, (b) => ({ ...b, ...partial }) as Block) },
        dirty: true,
      };
    }),

  reorderBlocks: (containerId, activeId, overId) =>
    set((state) => ({
      ...history(state),
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
      return { ...history(state), root: { ...state.root, children }, dirty: true };
    }),

  selectBlock: (id) =>
    set({ selectedBlockId: id, selectedBlockIds: id ? [id] : [] }),

  toggleBlockSelection: (id) =>
    set((state) => {
      if (id === state.root.id) return { selectedBlockId: id, selectedBlockIds: [id] };
      const has = state.selectedBlockIds.includes(id);
      const selectedBlockIds = has
        ? state.selectedBlockIds.filter((x) => x !== id)
        : [...state.selectedBlockIds, id];
      const selectedBlockId = has
        ? selectedBlockIds[selectedBlockIds.length - 1] ?? null
        : id;
      return { selectedBlockIds, selectedBlockId };
    }),

  extendSelectionTo: (id) =>
    set((state) => {
      const anchor = state.selectedBlockId;
      if (!anchor || anchor === id) return { selectedBlockId: id, selectedBlockIds: [id] };

      const anchorLoc = findContainerOf(state.root.children, anchor);
      const targetLoc = findContainerOf(state.root.children, id);
      // Range-select only works across siblings of one container; otherwise just add.
      if (!anchorLoc || !targetLoc || anchorLoc.containerId !== targetLoc.containerId) {
        const selectedBlockIds = state.selectedBlockIds.includes(id)
          ? state.selectedBlockIds
          : [...state.selectedBlockIds, id];
        return { selectedBlockIds, selectedBlockId: id };
      }

      const arr = getContainerChildren(state.root, anchorLoc.containerId) ?? [];
      const lo = Math.min(anchorLoc.index, targetLoc.index);
      const hi = Math.max(anchorLoc.index, targetLoc.index);
      const range = arr.slice(lo, hi + 1).map((b) => b.id);
      return { selectedBlockIds: range, selectedBlockId: id };
    }),

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
      return {
        ...history(state),
        root: { ...state.root, children },
        selectedBlockId: clone.id,
        selectedBlockIds: [clone.id],
        dirty: true,
      };
    }),

  pasteBlock: (containerId, index) =>
    set((state) => {
      if (!state.clipboard) return {};
      const clone = cloneBlockWithNewIds(state.clipboard);
      const parentId = containerId === state.root.id ? null : containerId;
      const children = insertInto(state.root.children, parentId, index, clone);
      return {
        ...history(state),
        root: { ...state.root, children },
        selectedBlockId: clone.id,
        selectedBlockIds: [clone.id],
        dirty: true,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};
      const previous = state.past[state.past.length - 1];
      return {
        root: previous,
        past: state.past.slice(0, -1),
        future: [state.root, ...state.future].slice(0, HISTORY_LIMIT),
        dirty: true,
        _histKey: null,
        _histTime: 0,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};
      const next = state.future[0];
      return {
        root: next,
        past: [...state.past, state.root].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        dirty: true,
        _histKey: null,
        _histTime: 0,
      };
    }),
}));

export function getSelectedBlock(): Block | null {
  const { root, selectedBlockId } = useEditorStore.getState();
  if (!selectedBlockId) return null;
  return findBlock(root, selectedBlockId);
}
