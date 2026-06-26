"use client";

import Link from "next/link";
import { ArrowLeft, Download, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store/editorStore";
import { blocksToHtml } from "@/lib/export/toHtml";

export function Toolbar({ readOnly = false }: { readOnly?: boolean }) {
  const name = useEditorStore((s) => s.name);
  const setName = useEditorStore((s) => s.setName);
  const dirty = useEditorStore((s) => s.dirty);
  const root = useEditorStore((s) => s.root);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  function handleExport() {
    const html = blocksToHtml(root);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "template"}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
          </>
        )}
        <Button size="sm" className="rounded-full" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" /> Export HTML
        </Button>
      </div>
    </div>
  );
}
