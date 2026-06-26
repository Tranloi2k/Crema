"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store/editorStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function useEditorShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const state = useEditorStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Undo / redo.
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        state.redo();
        return;
      }

      // Duplicate.
      if (mod && key === "d") {
        if (!state.selectedBlockId || state.selectedBlockId === state.root.id) return;
        e.preventDefault();
        state.duplicateBlock(state.selectedBlockId);
        return;
      }

      // Delete / Backspace removes the current selection (single or multi).
      if (key === "delete" || key === "backspace") {
        const ids = state.selectedBlockIds.filter((id) => id !== state.root.id);
        if (ids.length === 0) return;
        e.preventDefault();
        state.removeBlocks(ids);
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
