"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Lock, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { blocksToHtml } from "@/lib/export/toHtml";
import { normalizeRoot } from "@/lib/defaultBlocks";

export function TemplateCard({
  id,
  name,
  updatedAt,
  locked = false,
  onDeleted,
}: {
  id: string;
  name: string;
  updatedAt: number;
  locked?: boolean;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    onDeleted(id);
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
    <Card className="rounded-2xl border-muted-foreground/10 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
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
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
