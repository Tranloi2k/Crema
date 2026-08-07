import { normalizeRoot } from "@/lib/defaultBlocks";
import type { StackBlock } from "@/lib/types";

export const GUEST_DRAFT_STORAGE_KEY = "crema:guest-draft:v1";

// Shared message for when localStorage is unavailable (private browsing, quota
// exceeded, storage disabled). Reused everywhere a guest draft write fails so
// the wording stays consistent across the dashboard and the editor.
export const GUEST_STORAGE_UNAVAILABLE_MESSAGE =
  "Local storage is unavailable. Enable site storage to create a guest draft.";

export interface GuestDraft {
  id: string;
  name: string;
  root: StackBlock;
  updatedAt: number;
}

interface GuestDraftStore {
  version: 1;
  drafts: GuestDraft[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readGuestDrafts(): GuestDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(GUEST_DRAFT_STORAGE_KEY) ?? "null");
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.drafts)) return [];

    return parsed.drafts.flatMap((draft): GuestDraft[] => {
      if (
        !isRecord(draft) ||
        typeof draft.id !== "string" ||
        typeof draft.name !== "string" ||
        typeof draft.updatedAt !== "number" ||
        !("root" in draft)
      ) {
        return [];
      }
      return [{
        id: draft.id,
        name: draft.name,
        root: normalizeRoot(draft.root),
        updatedAt: draft.updatedAt,
      }];
    });
  } catch {
    return [];
  }
}

function writeGuestDrafts(drafts: GuestDraft[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    const store: GuestDraftStore = { version: 1, drafts };
    window.localStorage.setItem(GUEST_DRAFT_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    // Storage can be unavailable in private browsing or after quota exhaustion.
    return false;
  }
}

export function getGuestDraft(id: string): GuestDraft | null {
  return readGuestDrafts().find((draft) => draft.id === id) ?? null;
}

export function saveGuestDraft(draft: GuestDraft): boolean {
  const drafts = readGuestDrafts();
  const next = [draft, ...drafts.filter((item) => item.id !== draft.id)];
  return writeGuestDrafts(next);
}

export function deleteGuestDraft(id: string) {
  writeGuestDrafts(readGuestDrafts().filter((draft) => draft.id !== id));
}

export function createGuestDraftId(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return `guest-${window.crypto.randomUUID()}`;
  }
  return `guest-${Date.now()}`;
}
