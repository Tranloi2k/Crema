"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loader";
import { useEditorStore } from "@/lib/store/editorStore";
import { normalizeRoot } from "@/lib/defaultBlocks";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { StackBlock } from "@/lib/types";

interface VersionSummary {
  id: string;
  name: string;
  createdAt: number;
}

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryModal({
  templateId,
  open,
  onOpenChange,
}: {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loadVersion = useEditorStore((s) => s.loadVersion);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/templates/${templateId}/versions`)
      .then((res) => parseJsonResponse<VersionSummary[]>(res))
      .then((data) => setVersions(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false));
  }, [open, templateId]);

  async function restore(versionId: string) {
    setRestoringId(versionId);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${templateId}/versions/${versionId}`);
      const data = await parseJsonResponse<{ name: string; content: StackBlock }>(res);
      if (!res.ok || !data?.content) {
        setError("Could not restore this version.");
        return;
      }
      // Mark dirty so autosave persists the restored content (and snapshots the
      // pre-restore state remains in history).
      loadVersion(normalizeRoot(data.content), data.name);
      onOpenChange(false);
    } catch {
      setError("Could not restore this version.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,520px)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Version history
          </DialogTitle>
          <DialogDescription>
            Restore a previous checkpoint. Restoring replaces the canvas; your current
            work is autosaved first.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No saved versions yet. Checkpoints are captured automatically as you edit.
          </p>
        ) : (
          <ul className="max-h-[50vh] divide-y overflow-y-auto">
            {versions.map((v, i) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {formatWhen(v.createdAt)}
                    {i === 0 && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Latest
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{v.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={restoringId !== null}
                  onClick={() => restore(v.id)}
                >
                  {restoringId === v.id ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
