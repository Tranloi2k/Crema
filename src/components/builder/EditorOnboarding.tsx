"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Blocks, Eye, MousePointerClick, Save, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EDITOR_TOUR_EVENT,
  type EditorTourStepId,
} from "@/lib/editorTour";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "crema:editor-guided-tour:v2";
const SPOTLIGHT_GAP = 6;

const STEPS: Array<{
  id: EditorTourStepId;
  selector: string;
  icon: typeof Sparkles;
  title: string;
  description: string;
  placement: "left" | "right" | "bottom";
}> = [
  {
    id: "add-content",
    selector: '[data-tour="add-content"]',
    icon: Sparkles,
    title: "Add your first content",
    description: "Start with a ready-made section, or switch to Blocks to add one element at a time.",
    placement: "right",
  },
  {
    id: "properties",
    selector: '[data-tour="properties"]',
    icon: MousePointerClick,
    title: "Customize the selected block",
    description: "Select anything on the canvas, then edit its content, appearance, size, and spacing here.",
    placement: "left",
  },
  {
    id: "preview",
    selector: '[data-tour="preview"]',
    icon: Eye,
    title: "Preview before sending",
    description: "Check the email at desktop and mobile widths before you send or export it.",
    placement: "bottom",
  },
  {
    id: "send-test",
    selector: '[data-tour="send-test"]',
    icon: Send,
    title: "Send a real test email",
    description: "Open the template in a real inbox to verify links, spacing, images, and personalization.",
    placement: "bottom",
  },
  {
    id: "save",
    selector: '[data-tour="save"]',
    icon: Save,
    title: "Save your finished template",
    description: "Save changes when the template is ready. Crema also shows whether your latest edits are saved.",
    placement: "bottom",
  },
];

type TargetRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

function findVisibleTarget(selector: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }) ?? null;
}

export function EditorOnboarding({ storageScope }: { storageScope: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 340, height: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_KEY}:${storageScope}`;

  const locateTarget = useCallback(() => {
    if (!open) return;
    const target = findVisibleTarget(STEPS[step].selector);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
  }, [open, step]);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(storageKey) !== "done");
    } catch {
      setOpen(true);
    }
    setStep(0);

    function handleStart(event: Event) {
      const customEvent = event as CustomEvent<{ stepId?: EditorTourStepId }>;
      const requestedIndex = STEPS.findIndex((item) => item.id === customEvent.detail?.stepId);
      setStep(requestedIndex >= 0 ? requestedIndex : 0);
      setOpen(true);
    }

    window.addEventListener(EDITOR_TOUR_EVENT, handleStart);
    return () => window.removeEventListener(EDITOR_TOUR_EVENT, handleStart);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const target = findVisibleTarget(STEPS[step].selector);
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    const frame = window.requestAnimationFrame(locateTarget);
    const timer = window.setTimeout(locateTarget, 320);
    window.addEventListener("resize", locateTarget);
    window.addEventListener("scroll", locateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", locateTarget);
      window.removeEventListener("scroll", locateTarget, true);
    };
  }, [locateTarget, open, step]);

  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCardSize({ width: rect.width, height: rect.height });
  }, [open, step, targetRect]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
      if (event.key === "ArrowRight" && step < STEPS.length - 1) setStep((value) => value + 1);
      if (event.key === "ArrowLeft" && step > 0) setStep((value) => value - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      // The tour still closes for this session if storage is unavailable.
    }
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight;
  const margin = 12;
  let cardLeft = Math.max(margin, (viewportWidth - cardSize.width) / 2);
  let cardTop = Math.max(margin, (viewportHeight - cardSize.height) / 2);

  if (targetRect) {
    if (current.placement === "right" && targetRect.right + margin + cardSize.width <= viewportWidth) {
      cardLeft = targetRect.right + margin;
      cardTop = targetRect.top + targetRect.height / 2 - cardSize.height / 2;
    } else if (current.placement === "left" && targetRect.left - margin - cardSize.width >= 0) {
      cardLeft = targetRect.left - margin - cardSize.width;
      cardTop = targetRect.top + targetRect.height / 2 - cardSize.height / 2;
    } else {
      const hasRoomBelow = targetRect.bottom + margin + cardSize.height <= viewportHeight;
      cardTop = hasRoomBelow ? targetRect.bottom + margin : targetRect.top - margin - cardSize.height;
      cardLeft = targetRect.left + targetRect.width / 2 - cardSize.width / 2;
    }
    cardLeft = Math.min(viewportWidth - cardSize.width - margin, Math.max(margin, cardLeft));
    cardTop = Math.min(viewportHeight - cardSize.height - margin, Math.max(margin, cardTop));
  }

  const spotlight = targetRect
    ? {
        top: Math.max(0, targetRect.top - SPOTLIGHT_GAP),
        left: Math.max(0, targetRect.left - SPOTLIGHT_GAP),
        right: Math.min(viewportWidth, targetRect.right + SPOTLIGHT_GAP),
        bottom: Math.min(viewportHeight, targetRect.bottom + SPOTLIGHT_GAP),
      }
    : null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Quick start tour">
      {spotlight ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/55" style={{ height: spotlight.top }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/55" style={{ top: spotlight.bottom }} />
          <div className="absolute left-0 bg-black/55" style={{ top: spotlight.top, width: spotlight.left, height: spotlight.bottom - spotlight.top }} />
          <div className="absolute right-0 bg-black/55" style={{ top: spotlight.top, left: spotlight.right, height: spotlight.bottom - spotlight.top }} />
          <div
            className="pointer-events-none fixed rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background/80"
            style={{ top: spotlight.top, left: spotlight.left, width: spotlight.right - spotlight.left, height: spotlight.bottom - spotlight.top }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={cardRef}
        className="fixed z-[91] w-[min(21.25rem,calc(100vw-1.5rem))] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl"
        style={{ left: cardLeft, top: cardTop }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Step {step + 1} of {STEPS.length}</p>
            <h2 className="mt-1 text-sm font-semibold">{current.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{current.description}</p>
          </div>
          <button type="button" onClick={dismiss} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close quick start">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(index)}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", index <= step ? "bg-primary" : "bg-muted")}
              aria-label={`Go to step ${index + 1}: ${item.title}`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>Skip</Button>
          <div className="flex gap-2">
            {step > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setStep((value) => value - 1)}>Previous</Button>}
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" onClick={() => setStep((value) => value + 1)}>Next</Button>
            ) : (
              <Button type="button" size="sm" className="gap-2" onClick={dismiss}>
                <Blocks className="h-4 w-4" /> Start building
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
