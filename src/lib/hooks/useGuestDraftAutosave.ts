"use client";

import { useEffect, useState } from "react";
import { GUEST_STORAGE_UNAVAILABLE_MESSAGE, saveGuestDraft } from "@/lib/guestDrafts";
import { useEditorStore } from "@/lib/store/editorStore";

export function useGuestDraftAutosave(draftId: string | null) {
  const root = useEditorStore((state) => state.root);
  const name = useEditorStore((state) => state.name);
  const dirty = useEditorStore((state) => state.dirty);
  const markSaved = useEditorStore((state) => state.markSaved);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftId || !dirty) return;
    const saved = saveGuestDraft({ id: draftId, name, root, updatedAt: Date.now() });
    if (saved) {
      setSaveError(null);
      markSaved();
    } else {
      // localStorage write failed (private browsing, quota exceeded, storage
      // disabled). Do NOT call markSaved() here — `dirty` must stay true so the
      // "Saving locally…" indicator keeps reflecting reality, and we surface a
      // persistent error so the guest knows their work isn't actually saved.
      setSaveError(GUEST_STORAGE_UNAVAILABLE_MESSAGE);
    }
  }, [dirty, draftId, markSaved, name, root]);

  return { saveError };
}
