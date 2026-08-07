"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPlanLimits, type PlanId } from "@/lib/billing/plans";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

interface TemplateOption {
  id: string;
  name: string;
  locked: boolean;
}

interface UsageData {
  plan: PlanId;
  downgradeSelectionPending: boolean;
  templates: TemplateOption[];
}

export function DowngradeSelectionGate() {
  const { status } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/billing/usage")
      .then(async (res) => {
        const data = await parseJsonResponse<UsageData>(res);
        if (res.ok && data?.plan) setUsage(data);
      })
      .catch(() => {});
  }, [status]);

  const open = !!usage?.downgradeSelectionPending;
  const limits = usage ? getPlanLimits(usage.plan) : null;
  const maxSelect = limits?.maxTemplates ?? 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSelect) {
        next.add(id);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!usage || selected.size !== maxSelect) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/select-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save selection.");
        return;
      }
      setUsage(data);
      setSelected(new Set());
    } catch {
      setError("Could not save selection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose templates to keep editable</DialogTitle>
          <DialogDescription>
            Your plan changed. Select {maxSelect} template{maxSelect === 1 ? "" : "s"} to keep
            editing. The rest will be locked (view and export only). This choice is final.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto py-2">
          {usage?.templates.map((t) => {
            const isSelected = selected.has(t.id);
            const disabled = !isSelected && selected.size >= maxSelect;
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : disabled
                      ? "cursor-not-allowed opacity-50"
                      : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="truncate text-sm font-medium">{t.name}</span>
              </label>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            className="rounded-full"
            disabled={submitting || selected.size !== maxSelect}
            onClick={handleConfirm}
          >
            {submitting ? "Saving…" : `Confirm ${maxSelect} template${maxSelect === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
