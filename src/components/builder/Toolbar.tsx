"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, FileText, History, Link2, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store/editorStore";
import { blocksToHtml } from "@/lib/export/toHtml";
import { blocksToPlainText } from "@/lib/export/toPlainText";
import { HistoryModal } from "@/components/builder/HistoryModal";
import { ShareModal } from "@/components/builder/ShareModal";

export function Toolbar({
  readOnly = false,
  templateId,
}: {
  readOnly?: boolean;
  templateId?: string;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const name = useEditorStore((s) => s.name);
  const setName = useEditorStore((s) => s.setName);
  const dirty = useEditorStore((s) => s.dirty);
  const root = useEditorStore((s) => s.root);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  function downloadFile(content: string, mime: string, extension: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "template"}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    downloadFile(blocksToHtml(root), "text/html", "html");
  }

  function handleExportText() {
    downloadFile(blocksToPlainText(root), "text/plain;charset=utf-8", "txt");
  }

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {readOnly ? (
          <span className="text-sm font-medium">{name || "Template"}</span>
        ) : (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-56 rounded-full"
            />
            <span className="text-xs text-muted-foreground">
              {dirty ? "Saving..." : "Saved"}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            {templateId && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setHistoryOpen(true)}
                title="Version history"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        {templateId && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setShareOpen(true)}
            title="Share a read-only preview link"
          >
            <Link2 className="mr-1.5 h-4 w-4" /> Share
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleExportText}
          title="Download plain-text version (.txt)"
        >
          <FileText className="mr-1.5 h-4 w-4" /> Text
        </Button>
        <Button size="sm" className="rounded-full" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" /> Export HTML
        </Button>
      </div>
      {templateId && (
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
    </div>
  );
}
