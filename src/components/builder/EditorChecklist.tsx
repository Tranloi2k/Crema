"use client";

import { useEffect, useState } from "react";
import { Check, Circle, Eye, Save, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { startEditorTour, type EditorTourStepId } from "@/lib/editorTour";

const STORAGE_KEY = "crema:quick-start-completed:v1";

export function EditorChecklist({
  hasContent,
  hasPreviewed,
  hasSentTest,
  isSaved,
}: {
  hasContent: boolean;
  hasPreviewed: boolean;
  hasSentTest: boolean;
  isSaved: boolean;
}) {
  const [visibility, setVisibility] = useState<"checking" | "visible" | "hidden">(
    "checking",
  );
  const steps = [
    { label: "Add content", done: hasContent, icon: Sparkles, tourStep: "add-content" as EditorTourStepId },
    { label: "Preview", done: hasPreviewed, icon: Eye, tourStep: "preview" as EditorTourStepId },
    { label: "Send a test", done: hasSentTest, icon: Send, tourStep: "send-test" as EditorTourStepId },
    { label: "Save", done: hasContent && isSaved, icon: Save, tourStep: "save" as EditorTourStepId },
  ];
  const completed = steps.filter((item) => item.done).length;
  const isComplete = completed === steps.length;

  useEffect(() => {
    try {
      setVisibility(
        window.localStorage.getItem(STORAGE_KEY) === "done" ? "hidden" : "visible",
      );
    } catch {
      setVisibility("visible");
    }
  }, []);

  useEffect(() => {
    if (!isComplete || visibility !== "visible") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      // The checklist still hides for this session when storage is unavailable.
    }

    const timer = window.setTimeout(() => setVisibility("hidden"), 1200);
    return () => window.clearTimeout(timer);
  }, [isComplete, visibility]);

  if (visibility !== "visible") return null;

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-b bg-background px-3 sm:px-4">
      <div className="flex shrink-0 items-center gap-2 pr-1">
        <button type="button" onClick={() => startEditorTour()} className="rounded-md text-xs font-semibold text-foreground hover:text-primary">
          Quick start
        </button>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{completed}/4</span>
      </div>
      <div className="h-5 w-px shrink-0 bg-border" />
      <div className="flex min-w-max items-center gap-1">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", item.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                {item.done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className={cn(item.done && "text-muted-foreground line-through")}>{item.label}</span>
            </>
          );
          return (
            <div key={item.label} className="flex items-center">
              <button
                type="button"
                onClick={() => startEditorTour(item.tourStep)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={`Show where to ${item.label.toLowerCase()}`}
              >
                {content}
              </button>
              {index < steps.length - 1 && <Circle className="h-1.5 w-1.5 fill-border text-border" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
