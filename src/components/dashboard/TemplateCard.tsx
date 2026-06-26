"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Files, Loader2, Lock, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplatePreviewThumbnail } from "@/components/dashboard/TemplatePreviewThumbnail";
import { blocksToHtml } from "@/lib/export/toHtml";
import { normalizeRoot } from "@/lib/defaultBlocks";
import { cn } from "@/lib/utils";

export function TemplateCard({
  id,
  name,
  content,
  updatedAt,
  locked = false,
  duplicateDisabled = false,
  onDeleted,
  onDuplicated,
  onError,
}: {
  id: string;
  name: string;
  content: unknown;
  updatedAt: number;
  locked?: boolean;
  duplicateDisabled?: boolean;
  onDeleted: (id: string) => void;
  onDuplicated?: (template: {
    id: string;
    name: string;
    content: unknown;
    updatedAt: number;
    locked?: boolean;
  }) => void;
  onError?: (message: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError?.(data.error ?? "Could not delete template.");
        return;
      }
      setConfirmOpen(false);
      onDeleted(id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        onError?.(data.error ?? "Could not duplicate template.");
        return;
      }
      onDuplicated?.(data);
    } finally {
      setDuplicating(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/templates/${id}`);
      const data = await res.json();
      if (!data?.content) return;
      const html = blocksToHtml(normalizeRoot(data.content));
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name || "template"}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-muted-foreground/10 shadow-sm transition-shadow hover:shadow-md",
        duplicating && "pointer-events-none"
      )}
    >
      {duplicating && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[1px]">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Duplicating…</span>
        </div>
      )}
      <Link href={`/editor/${id}`} className="block">
        <TemplatePreviewThumbnail
          content={content}
          className="h-40 border-b border-muted-foreground/10"
        />
      </Link>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          {locked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(updatedAt).toLocaleString()}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <Button asChild size="sm" className="rounded-full">
          <Link href={`/editor/${id}`}>{locked ? "View" : "Open"}</Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={handleDuplicate}
            disabled={duplicating || duplicateDisabled}
            title="Duplicate template"
          >
            <Files className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={handleExport}
            disabled={exporting}
            title="Export HTML"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            title="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!deleting) setConfirmOpen(open);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">&ldquo;{name}&rdquo;</span>. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
