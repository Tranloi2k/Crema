"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Redo2,
  Save,
  Send,
  Share2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { startEditorTour } from "@/lib/editorTour";

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
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
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
  onTestSent,
}: {
  readOnly?: boolean;
  templateId?: string;
  isGuestDraft?: boolean;
  saving?: boolean;
  onSave?: () => void | Promise<void>;
  onPreview?: () => void;
  onTestSent?: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);
  const { requireAuth, authStatus, requestedAction, closeAuthPrompt } = useRequireAuth();

  const name = useEditorStore((state) => state.name);
  const setName = useEditorStore((state) => state.setName);
  const dirty = useEditorStore((state) => state.dirty);
  const root = useEditorStore((state) => state.root);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  const htmlSource = blocksToHtml(root);

  useEffect(() => {
    if (!exportOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [exportOpen]);

  function downloadFile(content: string, mime: string, extension: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name || "template"}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function requestExportHtml() {
    requireAuth("export", () => downloadFile(htmlSource, "text/html", "html"));
  }

  function requestExportText() {
    requireAuth("export", () =>
      downloadFile(blocksToPlainText(root), "text/plain;charset=utf-8", "txt"),
    );
  }

  async function handleSendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!testEmail.trim()) return;
    setTestStatus("sending");
    setTestError("");
    try {
      const response = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim(), html: htmlSource, subject: name }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setTestStatus("error");
        setTestError(data?.error ?? "Could not send the test email. Please try again.");
        return;
      }
      setTestStatus("success");
      onTestSent?.();
    } catch {
      setTestStatus("error");
      setTestError("Could not connect to the email service. Please try again.");
    }
  }

  function requestSendTest() {
    requireAuth("send-test", () => {
      setTestStatus("idle");
      setTestError("");
      setTestOpen(true);
    });
  }

  const saveLabel = saving ? "Saving…" : dirty ? "Save changes" : "Saved";
  const statusLabel = dirty
    ? isGuestDraft
      ? "Saving locally…"
      : "Unsaved changes"
    : isGuestDraft
      ? "Saved locally"
      : "All changes saved";

  return (
    <>
      <header className="relative z-30 flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b bg-background px-2 py-2 shadow-sm sm:flex-nowrap sm:gap-4 sm:px-4">
        <div className="flex w-full min-w-0 flex-none items-center gap-2 sm:w-auto sm:flex-1 sm:gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg border border-transparent hover:border-border">
            <Link href="/dashboard" title="Back to dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="h-7 w-px shrink-0 bg-border" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email editor</p>
            <div className="flex min-w-0 items-center gap-2">
              {readOnly ? (
                <span className="max-w-64 truncate text-sm font-semibold">{name || "Template"}</span>
              ) : (
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-w-24 max-w-64 truncate border-0 bg-transparent p-0 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                  placeholder="Untitled template"
                  aria-label="Template name"
                />
              )}
              <span
                className={cn(
                  "hidden shrink-0 items-center gap-1.5 text-[11px] font-medium min-[420px]:inline-flex",
                  dirty ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-none items-center justify-start gap-1.5 overflow-x-auto sm:w-auto sm:shrink-0 sm:justify-end sm:overflow-visible">
          {!readOnly && (
            <div className="mr-1 hidden items-center rounded-lg border bg-muted/35 p-0.5 md:flex">
              <ToolbarIconButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                <Undo2 className="h-4 w-4" />
              </ToolbarIconButton>
              <ToolbarIconButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                <Redo2 className="h-4 w-4" />
              </ToolbarIconButton>
              {templateId && !isGuestDraft && (
                <ToolbarIconButton onClick={() => setHistoryOpen(true)} title="Version history">
                  <History className="h-4 w-4" />
                </ToolbarIconButton>
              )}
            </div>
          )}

          {templateId && !isGuestDraft && (
            <div className="hidden items-center lg:flex">
              <ToolbarIconButton onClick={() => setShareOpen(true)} title="Share preview link">
                <Share2 className="h-4 w-4" />
              </ToolbarIconButton>
            </div>
          )}

          {!readOnly && (
            <ToolbarIconButton onClick={() => startEditorTour()} title="Open quick start tour">
              <CircleHelp className="h-4 w-4" />
            </ToolbarIconButton>
          )}

          {onPreview && (
            <Button data-tour="preview" variant="outline" size="sm" onClick={onPreview} className="h-9 gap-2 rounded-lg px-2 sm:px-3">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}

          {!readOnly && (
            <Button
              data-tour="send-test"
              variant="outline"
              size="sm"
              onClick={requestSendTest}
              disabled={authStatus === "loading"}
              title="Send a test email"
              className="h-9 gap-2 rounded-lg px-2 sm:px-3"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send test</span>
            </Button>
          )}

          {!readOnly && onSave && (
            <Button
              data-tour="save"
              onClick={() => requireAuth("save", onSave)}
              disabled={saving || authStatus === "loading"}
              className="h-9 gap-2 rounded-lg px-2 font-semibold shadow-sm sm:min-w-28 sm:px-4"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              <span className="hidden sm:inline">{saveLabel}</span>
            </Button>
          )}

          <div ref={exportRef} className="relative">
            <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-primary/25 bg-primary/5 text-primary">
              <button
                type="button"
                onClick={requestExportHtml}
                disabled={authStatus === "loading"}
                className="inline-flex items-center gap-2 px-2 text-sm font-semibold transition-colors hover:bg-primary/10 disabled:opacity-50 sm:px-3"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="w-px bg-primary/20" aria-hidden />
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                className="inline-flex w-8 items-center justify-center transition-colors hover:bg-primary/10"
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                aria-label="More export options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {exportOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-52 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-xl">
                <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Download as</p>
                <button type="button" role="menuitem" onClick={requestExportHtml} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  <span><span className="block font-medium">HTML file</span><span className="block text-[11px] text-muted-foreground">Ready for email platforms</span></span>
                </button>
                <button type="button" role="menuitem" onClick={requestExportText} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span><span className="block font-medium">Plain text</span><span className="block text-[11px] text-muted-foreground">Content without styling</span></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send a test email</DialogTitle>
            <DialogDescription>Check this template in a real inbox before exporting it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendTest} className="mt-1 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="test-email" className="text-sm font-medium">Recipient email</label>
              <Input
                id="test-email"
                type="email"
                autoFocus
                required
                placeholder="you@company.com"
                value={testEmail}
                onChange={(event) => {
                  setTestEmail(event.target.value);
                  setTestStatus("idle");
                  setTestError("");
                }}
              />
              <p className="text-xs text-muted-foreground">Subject: {name || "Untitled template"}</p>
            </div>
            {testStatus === "success" && <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">Test email sent successfully.</p>}
            {testStatus === "error" && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{testError || "Could not send the test email. Please try again."}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={testStatus === "sending"} className="gap-2">
                {testStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {testStatus === "sending" ? "Sending…" : "Send test"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {templateId && !isGuestDraft && (
        <>
          <HistoryModal templateId={templateId} open={historyOpen} onOpenChange={setHistoryOpen} />
          <ShareModal templateId={templateId} open={shareOpen} onOpenChange={setShareOpen} />
        </>
      )}
      <RequireAuthDialog action={requestedAction} onOpenChange={(open) => { if (!open) closeAuthPrompt(); }} />
    </>
  );
}
