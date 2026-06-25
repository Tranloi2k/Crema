"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { blocksToHtml } from "@/lib/export/toHtml";
import { substituteMergeTags } from "@/lib/mergeTags/substitute";
import { useEditorStore } from "@/lib/store/editorStore";
import type { StackBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

type PreviewMode = "desktop" | "mobile";

const PREVIEW_WIDTHS: Record<PreviewMode, number> = {
  desktop: 600,
  mobile: 375,
};

const FALLBACK_PREVIEW_HEIGHT = 320;

export function PreviewModal({
  root,
  open,
  onOpenChange,
}: {
  root: StackBlock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [useSampleData, setUseSampleData] = useState(false);
  const mergeTagProvider = useEditorStore((s) => s.mergeTagProvider);
  const previewWidth = PREVIEW_WIDTHS[mode];

  const srcDoc = useMemo(() => {
    let html = blocksToHtml(root, { width: previewWidth });
    if (useSampleData) {
      html = substituteMergeTags(html, mergeTagProvider);
    }
    return html;
  }, [root, previewWidth, useSampleData, mergeTagProvider]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(FALLBACK_PREVIEW_HEIGHT);

  const syncIframeHeight = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const measure = () => {
      const email = doc.getElementById("crema-email");
      if (!email) return;
      const next = Math.ceil(email.getBoundingClientRect().height);
      if (next > 0) setIframeHeight(next);
    };

    measure();
    requestAnimationFrame(measure);
    window.setTimeout(measure, 50);
    window.setTimeout(measure, 150);
    doc.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(syncIframeHeight, 0);
    return () => window.clearTimeout(timer);
  }, [open, srcDoc, syncIframeHeight]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,920px)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle>Email preview</DialogTitle>
              <DialogDescription className="mt-1">
                Xem email như trong hộp thư — chuyển Desktop / Mobile để kiểm tra bố cục.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={useSampleData ? "default" : "outline"}
                onClick={() => setUseSampleData((v) => !v)}
                className="h-8 px-3 text-xs"
              >
                {useSampleData ? "Sample data on" : "Sample data off"}
              </Button>
              <div className="flex rounded-lg border bg-muted/40 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={mode === "desktop" ? "default" : "ghost"}
                onClick={() => setMode("desktop")}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "mobile" ? "default" : "ghost"}
                onClick={() => setMode("mobile")}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-[#e8e8ec] p-6">
          <div className="mx-auto flex justify-center">
            <div
              className={cn(
                "overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition-[width] duration-200",
                mode === "mobile" && "rounded-[1.25rem] ring-2 ring-black/10"
              )}
              style={{ width: previewWidth, maxWidth: "100%" }}
            >
              <iframe
                ref={iframeRef}
                key={mode}
                title="Email preview"
                srcDoc={srcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
                onLoad={syncIframeHeight}
                className="block w-full border-0 bg-white overflow-hidden"
                style={{ height: iframeHeight }}
              />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {previewWidth}px wide · {mode === "desktop" ? "Desktop inbox" : "Mobile inbox"}
            {useSampleData && " · Variables replaced with sample values"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
