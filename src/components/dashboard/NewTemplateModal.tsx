"use client";

import { useState } from "react";
import { FilePlus2, LayoutTemplate } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/loader";
import { PRESET_TEMPLATES } from "@/lib/emails/presetTemplates";
import { cn } from "@/lib/utils";

type Choice = "blank" | string;

export function NewTemplateModal({
  open,
  onOpenChange,
  onCreate,
  creating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves once navigation/creation kicks off. preset is "" for a blank template. */
  onCreate: (preset: string) => void;
  creating: boolean;
}) {
  const [pending, setPending] = useState<Choice | null>(null);

  function choose(choice: Choice) {
    setPending(choice);
    onCreate(choice === "blank" ? "" : choice);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!creating) {
          setPending(null);
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="w-[min(96vw,640px)] max-w-none">
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
          <DialogDescription>
            Start from scratch or pick a ready-made layout you can customize.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => choose("blank")}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-60",
              pending === "blank" && "border-primary ring-1 ring-primary"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              {creating && pending === "blank" ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <FilePlus2 className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium">Blank template</span>
            <span className="text-xs text-muted-foreground">An empty canvas to build on.</span>
          </button>

          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={creating}
              onClick={() => choose(preset.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-60",
                pending === preset.id && "border-primary ring-1 ring-primary"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                {creating && pending === preset.id ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="text-sm font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
