"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loader";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

interface ShareState {
  isPublic: boolean;
  publicSlug: string | null;
}

export function ShareModal({
  templateId,
  open,
  onOpenChange,
}: {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<ShareState | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setCopied(false);
    fetch(`/api/templates/${templateId}`)
      .then((res) => parseJsonResponse<ShareState>(res))
      .then((data) =>
        setState({ isPublic: !!data?.isPublic, publicSlug: data?.publicSlug ?? null })
      )
      .catch(() => setState({ isPublic: false, publicSlug: null }))
      .finally(() => setLoading(false));
  }, [open, templateId]);

  const shareUrl =
    state?.publicSlug && typeof window !== "undefined"
      ? `${window.location.origin}/p/${state.publicSlug}`
      : "";

  async function toggle(enable: boolean) {
    setToggling(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/share`, {
        method: enable ? "POST" : "DELETE",
      });
      const data = await parseJsonResponse<ShareState>(res);
      if (res.ok && data) {
        setState({ isPublic: !!data.isPublic, publicSlug: data.publicSlug ?? null });
      }
    } finally {
      setToggling(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; the input is selectable as a fallback.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,460px)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Share preview
          </DialogTitle>
          <DialogDescription>
            Create a read-only public link so anyone can preview this email without signing in.
          </DialogDescription>
        </DialogHeader>

        {loading || !state ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : state.isPublic && shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="h-9 text-xs" />
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0 rounded-lg"
                onClick={copy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the current design. Editing stays private.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-destructive hover:text-destructive"
              disabled={toggling}
              onClick={() => toggle(false)}
            >
              {toggling ? "Updating..." : "Stop sharing"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sharing is off. Turn it on to generate a public preview link.
            </p>
            <Button
              className="rounded-full"
              disabled={toggling}
              onClick={() => toggle(true)}
            >
              {toggling ? "Creating link..." : "Create share link"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
