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
  const root = useEditorStore((s) => s.root);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "d") return;
      if (!selectedBlockId || selectedBlockId === root.id) return;

      e.preventDefault();
      duplicateBlock(selectedBlockId);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBlockId, root.id, duplicateBlock]);
}
