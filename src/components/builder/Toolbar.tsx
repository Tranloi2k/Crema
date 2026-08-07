"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Redo2,
  Save,
  Share2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditorStore } from "@/lib/store/editorStore";
import { blocksToHtml } from "@/lib/export/toHtml";
import { blocksToPlainText } from "@/lib/export/toPlainText";
import { HistoryModal } from "@/components/builder/HistoryModal";
import { ShareModal } from "@/components/builder/ShareModal";
import { cn } from "@/lib/utils";
import { RequireAuthDialog } from "@/components/auth/RequireAuthDialog";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";

function ToolbarIconButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ToolbarTextButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Toolbar({
  readOnly = false,
  templateId,
  isGuestDraft = false,
  saving = false,
  onSave,
  onPreview,
}: {
  readOnly?: boolean;
  templateId?: string;
  isGuestDraft?: boolean;
  saving?: boolean;
  onSave?: () => void | Promise<void>;
  onPreview?: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { requireAuth, authStatus, requestedAction, closeAuthPrompt } = useRequireAuth();

  const name = useEditorStore((s) => s.name);
  const setName = useEditorStore((s) => s.setName);
  const dirty = useEditorStore((s) => s.dirty);
  const root = useEditorStore((s) => s.root);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  const htmlSource = blocksToHtml(root);

  useEffect(() => {
    if (!exportOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!exportRef.current?.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [exportOpen]);

  function downloadFile(content: string, mime: string, extension: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "template"}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function handleExportHtml() {
    downloadFile(htmlSource, "text/html", "html");
  }

  function handleExportText() {
    downloadFile(blocksToPlainText(root), "text/plain;charset=utf-8", "txt");
  }

  function requestExportHtml() {
    requireAuth("export", handleExportHtml);
  }

  function requestExportText() {
    requireAuth("export", handleExportText);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b bg-background px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-md"
          >
            <Link href="/dashboard" title="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="h-5 w-px shrink-0 bg-border" aria-hidden />

          <div className="flex min-w-0 items-center gap-2.5">
            {readOnly ? (
              <span className="truncate text-sm font-medium">
                {name || "Template"}
              </span>
            ) : (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 max-w-[min(100%,20rem)] truncate border-0 bg-transparent text-sm font-medium text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:ring-0"
                placeholder="Untitled template"
                aria-label="Template name"
              />
            )}
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                dirty
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {!dirty && <Check className="h-3 w-3" />}
              {dirty
                ? isGuestDraft
                  ? "Saving locally…"
                  : "Saving…"
                : isGuestDraft
                  ? "Saved locally"
                  : "Saved"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!readOnly && (
            <div className="mr-1 flex items-center rounded-lg bg-muted/80 p-0.5">
              <ToolbarIconButton
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </ToolbarIconButton>
              <ToolbarIconButton
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </ToolbarIconButton>
              {templateId && !isGuestDraft && (
                <ToolbarIconButton
                  onClick={() => setHistoryOpen(true)}
                  title="Version history"
                >
                  <History className="h-4 w-4" />
                </ToolbarIconButton>
              )}
            </div>
          )}

          <ToolbarIconButton
            onClick={() => setCodeOpen(true)}
            title="View HTML source"
          >
            <Code2 className="h-4 w-4" />
          </ToolbarIconButton>

          {onPreview && (
            <ToolbarTextButton onClick={onPreview} title="Preview email">
              <Eye className="h-4 w-4" />
              Preview
            </ToolbarTextButton>
          )}

          {templateId && !isGuestDraft && (
            <ToolbarTextButton
              onClick={() => setShareOpen(true)}
              title="Share a read-only preview link"
            >
              <Share2 className="h-4 w-4" />
              Share
            </ToolbarTextButton>
          )}

          {!readOnly && onSave && (
            <ToolbarTextButton
              onClick={() => requireAuth("save", onSave)}
              disabled={saving || authStatus === "loading"}
              title="Save template"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save"}
            </ToolbarTextButton>
          )}

          <div ref={exportRef} className="relative ml-1">
            <div className="flex items-stretch overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm">
              <button
                type="button"
                onClick={requestExportHtml}
                disabled={authStatus === "loading"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Export HTML
              </button>
              <div className="w-px bg-primary-foreground/20" aria-hidden />
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                className="inline-flex items-center px-2 transition-colors hover:bg-primary/90"
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                title="More export options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {exportOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.375rem)] z-50 min-w-[11rem] overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={requestExportHtml}
                  disabled={authStatus === "loading"}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  Export HTML
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={requestExportText}
                  disabled={authStatus === "loading"}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Export plain text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4 pr-14 text-left">
            <DialogTitle>HTML source</DialogTitle>
            <DialogDescription>
              Exported markup for this template.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[min(60vh,32rem)] overflow-auto bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
            <code>{htmlSource}</code>
          </pre>
        </DialogContent>
      </Dialog>

      {templateId && !isGuestDraft && (
        <>
          <HistoryModal
            templateId={templateId}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
          />
          <ShareModal
            templateId={templateId}
            open={shareOpen}
            onOpenChange={setShareOpen}
          />
        </>
      )}
      <RequireAuthDialog
        action={requestedAction}
        onOpenChange={(open) => {
          if (!open) closeAuthPrompt();
        }}
      />
    </>
  );
}
