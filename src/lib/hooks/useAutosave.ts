"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store/editorStore";

export function useAutosave(templateId: string | null) {
  const root = useEditorStore((s) => s.root);
  const name = useEditorStore((s) => s.name);
  const dirty = useEditorStore((s) => s.dirty);
  const markSaved = useEditorStore((s) => s.markSaved);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!templateId || !dirty) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, root }),
        });
        if (res.ok) markSaved();
      } catch {
        // Retry on next edit
      }
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, name, dirty, templateId]);
}
