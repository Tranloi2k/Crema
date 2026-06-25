"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store/editorStore";
import { blocksToHtml } from "@/lib/export/toHtml";

export function Toolbar({
  onPreview,
  readOnly = false,
}: {
  onPreview: () => void;
  readOnly?: boolean;
}) {
  const name = useEditorStore((s) => s.name);
  const setName = useEditorStore((s) => s.setName);
  const dirty = useEditorStore((s) => s.dirty);
  const root = useEditorStore((s) => s.root);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

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

  async function handleSendTest() {
    if (!testEmail) return;
    setSending(true);
    try {
      await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail, html: blocksToHtml(root), subject: name }),
      });
    } finally {
      setSending(false);
    }
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
            <Input
              placeholder="test@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-8 w-44 rounded-full"
            />
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleSendTest} disabled={sending}>
              <Send className="mr-1.5 h-4 w-4" /> Send test
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" className="rounded-full" onClick={onPreview}>
          <Eye className="mr-1.5 h-4 w-4" /> Preview
        </Button>
        <Button size="sm" className="rounded-full" onClick={handleExport}>
          <Download className="mr-1.5 h-4 w-4" /> Export HTML
        </Button>
      </div>
    </div>
  );
}
