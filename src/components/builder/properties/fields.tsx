"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Link2, Unlink2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dimension, FlexAlign, FlexJustify, Sides, Corners, Unit } from "@/lib/types";
import { UNIT_OPTIONS, SIZE_UNIT_OPTIONS, sides as makeSides, corners as makeCorners, dim } from "@/lib/types";
import {
  convertDimensionUnit,
  getParentHeightPxForBlock,
  getParentWidthPxForBlock,
  measureBlockSizePx,
} from "@/lib/layout/convertDimension";
import {
  aspectRatioLockPatch,
  blockSupportsAspectRatioLock,
  coupleDimensionChange,
} from "@/lib/layout/aspectRatio";
import { blockResizableAxes } from "@/lib/layout/dimensions";
import type { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { cn } from "@/lib/utils";

// Section: collapsible group with a + / − icon. Header click toggles open.
export function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted active:bg-muted/80"
      >
        <span>{title}</span>
        {open ? (
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="flex flex-col gap-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

// Row: horizontal label + control(s). Compact density matches the Framer-style
// reference: label fixed-width on the left, fields filling the right.
export function Row({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex gap-2", align === "start" ? "items-start" : "items-center")}
    >
      <Label
        className={cn(
          "w-[88px] shrink-0 text-xs font-normal text-muted-foreground",
          align === "start" && "pt-1.5"
        )}
      >
        {label}
      </Label>
      <div className="flex min-w-0 flex-1 items-center gap-1 [&>select]:flex-1 [&>input]:flex-1">{children}</div>
    </div>
  );
}

const SELECT_CLASS =
  "h-7 w-full rounded-md border border-input bg-background px-2 text-xs capitalize transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring";

/** Shared styles for segmented option controls in side panels. */
export function optionButtonClass(selected: boolean, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    selected
      ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      : "border-input bg-background text-foreground hover:border-primary/60 hover:bg-muted active:border-primary active:bg-primary/20",
    className
  );
}

export function OptionButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={optionButtonClass(selected, className)}>
      {children}
    </button>
  );
}

export function OptionButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex w-full gap-1", className)}>{children}</div>;
}

function UniformBoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5", className)} aria-hidden>
      <rect x="3.5" y="3.5" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IndividualSidesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5", className)} aria-hidden>
      <rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3.5" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="1.2 1.2" />
      <line x1="10" y1="3.5" x2="10" y2="12.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.2 1.2" />
      <line x1="3.5" y1="10" x2="12.5" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="1.2 1.2" />
      <line x1="6" y1="3.5" x2="6" y2="12.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.2 1.2" />
    </svg>
  );
}

function IndividualCornersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5", className)} aria-hidden>
      <path
        d="M6 3.5H10C11.1 3.5 12 4.4 12 5.5V6M12.5 10V10C12.5 11.1 11.6 12 10.5 12H10M6 12.5H5.5C4.4 12.5 3.5 11.6 3.5 10.5V10M3.5 6V5.5C3.5 4.4 4.4 3.5 5.5 3.5H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ModeToggle({
  linked,
  onChange,
  mode,
}: {
  linked: boolean;
  onChange: (linked: boolean) => void;
  mode: "sides" | "corners";
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-input bg-background">
      <button
        type="button"
        onClick={() => onChange(true)}
        title="Uniform"
        aria-label="Use one value for every side"
        aria-pressed={linked}
        className={cn(
          "flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          linked && "bg-muted text-foreground"
        )}
      >
        <UniformBoxIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        title="Individual"
        aria-label="Set each side separately"
        aria-pressed={!linked}
        className={cn(
          "flex h-7 w-7 items-center justify-center border-l border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          !linked && "bg-muted text-foreground"
        )}
      >
        {mode === "sides" ? <IndividualSidesIcon /> : <IndividualCornersIcon />}
      </button>
    </div>
  );
}

function SegmentedNumberBar({
  segments,
  onChange,
  min,
}: {
  segments: { key: string; label: string; value: number }[];
  onChange: (key: string, value: number) => void;
  min?: number;
}) {
  return (
    <div>
      <div className="flex overflow-hidden rounded-md border border-input bg-background">
        {segments.map((seg, i) => (
          <div key={seg.key} className={cn("min-w-0 flex-1", i > 0 && "border-l border-input")}>
            <input
              type="number"
              min={min}
              value={seg.value}
              onChange={(e) => onChange(seg.key, Number(e.target.value))}
              className="h-7 w-full bg-transparent text-center text-xs outline-none transition-colors focus:bg-accent/60"
            />
          </div>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-4">
        {segments.map((seg) => (
          <span key={seg.key} className="text-center text-[10px] font-medium text-muted-foreground">
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SelectInput<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        const next = (typeof value === "number" ? Number(raw) : raw) as T;
        onChange(next);
      }}
      className={SELECT_CLASS}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Font picker with live preview — options use email-safe system font stacks. */
export function FontFamilySelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={SELECT_CLASS}
      style={{ fontFamily: value }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ fontFamily: o.value }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-1.5">
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input p-0.5"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#ffffff"
        className="h-7 flex-1 font-mono text-xs"
      />
    </div>
  );
}

type UnitOption = { label: string; shortLabel?: string; value: Unit };

function SizeModeSelect({
  value,
  options,
  onChange,
}: {
  value: Unit;
  options: UnitOption[];
  onChange: (unit: Unit) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const closedLabel = selected?.shortLabel ?? selected?.label ?? "";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-7 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-sm",
          "transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          open && "border-primary ring-1 ring-ring"
        )}
      >
        <span className="truncate">{closedLabel}</span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+2px)] z-50 min-w-full overflow-hidden rounded-md border bg-popover p-1 shadow-md"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted",
                o.value === value && "bg-muted font-medium"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SizeValueField({
  value,
  unitSuffix,
  onChange,
}: {
  value: number;
  unitSuffix: string | null;
  onChange: (next: number) => void;
}) {
  function handleValueChange(raw: string) {
    if (raw === "") {
      onChange(0);
      return;
    }
    const next = Number(raw.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(next)) return;
    onChange(Math.max(0, next));
  }

  function step(delta: number) {
    onChange(Math.max(0, value + delta));
  }

  return (
    <div className="flex h-7 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 pl-2 pr-1">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              step(e.shiftKey ? 10 : 1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              step(e.shiftKey ? -10 : -1);
            }
          }}
          className="min-w-[1.25rem] flex-1 bg-transparent text-xs tabular-nums outline-none"
        />
        {unitSuffix && (
          <span className="shrink-0 text-xs text-muted-foreground">{unitSuffix}</span>
        )}
      </div>
      <div className="flex w-5 shrink-0 flex-col border-l border-input">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => step(1)}
          className="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Increase"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => step(-1)}
          className="flex flex-1 items-center justify-center border-t border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Decrease"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function UnitInput({
  value,
  onChange,
  unitOptions = UNIT_OPTIONS,
  parentSizePx,
  measuredPx,
  variant = "default",
}: {
  value: Dimension;
  onChange: (d: Dimension) => void;
  unitOptions?: UnitOption[];
  parentSizePx?: number;
  /** Live rendered size (px) used so Fit content → Fixed keeps the real size. */
  measuredPx?: number;
  /** `size` = Framer-style value field + compact mode selector. */
  variant?: "default" | "size";
}) {
  const numericDisabled = value.unit === "fit-content" || value.unit === "fill";
  const unitSuffix = !numericDisabled ? (value.unit === "px" ? "px" : value.unit === "%" ? "%" : null) : null;

  function handleUnitChange(nextUnit: Unit) {
    if (nextUnit === value.unit) return;
    if (parentSizePx !== undefined && parentSizePx > 0) {
      onChange(convertDimensionUnit(value, nextUnit, parentSizePx, measuredPx));
      return;
    }
    onChange({ ...value, unit: nextUnit });
  }

  function handleValueChange(raw: string) {
    if (raw === "") {
      if (numericDisabled) return;
      onChange({ ...value, value: 0 });
      return;
    }
    const next = Number(raw.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(next)) return;
    if (numericDisabled) {
      onChange(dim(next, "px"));
      return;
    }
    onChange({ ...value, value: next });
  }

  if (variant === "size") {
    return (
      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1.4fr)_minmax(4.25rem,0.85fr)] items-center gap-1.5">
        {numericDisabled ? (
          <div className="flex h-7 items-center rounded-md border border-input bg-background px-2 text-xs text-muted-foreground shadow-sm">
            Auto
          </div>
        ) : (
          <SizeValueField
            value={value.value}
            unitSuffix={unitSuffix}
            onChange={(next) => onChange({ ...value, value: next })}
          />
        )}
        <SizeModeSelect value={value.unit} options={unitOptions} onChange={handleUnitChange} />
      </div>
    );
  }

  const modeSelect = (
    <select
      value={value.unit}
      onChange={(e) => handleUnitChange(e.target.value as Unit)}
      title={unitOptions.find((u) => u.value === value.unit)?.label}
      className="h-7 w-full shrink-0 rounded-md border border-input bg-background px-1.5 text-xs font-medium"
    >
      {unitOptions.map((u) => (
        <option key={u.value} value={u.value}>
          {u.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="grid w-full grid-cols-[minmax(5.5rem,1fr)_5.75rem] gap-1">
      <div
        className={cn(
          "flex h-7 min-w-0 items-center rounded-md border border-input bg-transparent shadow-sm",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
        )}
      >
        {numericDisabled ? (
          <span className="px-2 text-xs text-muted-foreground">Auto</span>
        ) : (
          <>
            <input
              type="text"
              inputMode="decimal"
              value={value.value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs tabular-nums outline-none"
            />
            {unitSuffix && (
              <span className="shrink-0 pr-2 text-xs text-muted-foreground">{unitSuffix}</span>
            )}
          </>
        )}
      </div>
      {modeSelect}
    </div>
  );
}

export function HeightUnitInput({
  blockId,
  value,
  onChange,
}: {
  blockId: string;
  value: Dimension;
  onChange: (d: Dimension) => void;
}) {
  const root = useEditorStore((s) => s.root);
  const zoom = useEditorStore((s) => s.zoom);
  const parentPx = getParentHeightPxForBlock(root, blockId);
  return (
    <UnitInput
      value={value}
      onChange={onChange}
      unitOptions={SIZE_UNIT_OPTIONS}
      parentSizePx={parentPx}
      measuredPx={measureBlockSizePx(blockId, zoom)?.height}
      variant="size"
    />
  );
}

export function WidthUnitInput({
  blockId,
  value,
  onChange,
}: {
  blockId: string;
  value: Dimension;
  onChange: (d: Dimension) => void;
}) {
  const root = useEditorStore((s) => s.root);
  const zoom = useEditorStore((s) => s.zoom);
  const parentPx = getParentWidthPxForBlock(root, blockId);
  return (
    <UnitInput
      value={value}
      onChange={onChange}
      unitOptions={SIZE_UNIT_OPTIONS}
      parentSizePx={parentPx}
      measuredPx={measureBlockSizePx(blockId, zoom)?.width}
      variant="size"
    />
  );
}

function AspectRatioLockButton({
  locked,
  onToggle,
}: {
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={locked ? "Unlock width/height ratio" : "Lock width/height ratio"}
      aria-label={locked ? "Unlock width/height ratio" : "Lock width/height ratio"}
      aria-pressed={locked}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        locked
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-input bg-background text-muted-foreground hover:border-primary/60 hover:bg-muted hover:text-foreground"
      )}
    >
      {locked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink2 className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Width + optional aspect-ratio lock + height — shared by resizable blocks. */
export function BlockSizeSection({
  block,
  width,
  height,
  onSizeChange,
}: {
  block: Block;
  width: Dimension;
  height: Dimension;
  onSizeChange: (width: Dimension, height: Dimension) => void;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const root = useEditorStore((s) => s.root);
  const zoom = useEditorStore((s) => s.zoom);
  const locked = !!block.lockAspectRatio;
  const ratio = block.aspectRatio;
  const axes = blockResizableAxes(block);
  const showLock = blockSupportsAspectRatioLock(block) && axes.width && axes.height;

  function applySize(nextWidth: Dimension, nextHeight: Dimension, unlock?: boolean) {
    if (unlock) {
      updateBlock(block.id, {
        lockAspectRatio: false,
        aspectRatio: undefined,
        style: { ...block.style, width: nextWidth, height: nextHeight },
      } as Partial<Block>);
      return;
    }
    onSizeChange(nextWidth, nextHeight);
  }

  function handleWidth(next: Dimension) {
    if (locked && ratio) {
      const coupled = coupleDimensionChange(block, root, block.id, "width", next, ratio);
      if (coupled.unlock) {
        applySize(coupled.width, coupled.height, true);
        return;
      }
      applySize(coupled.width, coupled.height);
      return;
    }
    onSizeChange(next, height);
  }

  function handleHeight(next: Dimension) {
    if (locked && ratio) {
      const coupled = coupleDimensionChange(block, root, block.id, "height", next, ratio);
      if (coupled.unlock) {
        applySize(coupled.width, coupled.height, true);
        return;
      }
      applySize(coupled.width, coupled.height);
      return;
    }
    onSizeChange(width, next);
  }

  function toggleLock() {
    updateBlock(block.id, aspectRatioLockPatch(block, zoom));
  }

  return (
    <>
      <Row label="Width">
        <WidthUnitInput blockId={block.id} value={width} onChange={handleWidth} />
      </Row>
      {showLock && (
        <div className="flex items-center gap-2 pl-[96px]">
          <AspectRatioLockButton locked={locked} onToggle={toggleLock} />
          <span className="text-[10px] text-muted-foreground">
            {locked ? "Ratio locked" : "Lock ratio"}
          </span>
        </div>
      )}
      <Row label="Height">
        <HeightUnitInput blockId={block.id} value={height} onChange={handleHeight} />
      </Row>
    </>
  );
}

// SidesInput — Framer-style: uniform input + mode toggle, or segmented T/R/B/L bar.
export function SidesInput({
  value,
  onChange,
}: {
  value: Sides;
  onChange: (s: Sides) => void;
}) {
  function set(field: keyof Omit<Sides, "linked">, v: number) {
    onChange({ ...value, [field]: Math.max(0, Number.isFinite(v) ? v : 0) });
  }

  function setLinked(linked: boolean) {
    if (linked) {
      onChange(makeSides(value.top, true));
    } else {
      onChange({ ...value, linked: false });
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {value.linked ? (
          <Input
            type="number"
            min={0}
            value={value.top}
            onChange={(e) => onChange(makeSides(Math.max(0, Number(e.target.value) || 0), true))}
            className="h-7 flex-1 text-xs"
          />
        ) : (
          <div className="flex-1" />
        )}
        <ModeToggle linked={value.linked} onChange={setLinked} mode="sides" />
      </div>
      {!value.linked && (
        <SegmentedNumberBar
          segments={[
            { key: "top", label: "T", value: value.top },
            { key: "right", label: "R", value: value.right },
            { key: "bottom", label: "B", value: value.bottom },
            { key: "left", label: "L", value: value.left },
          ]}
          onChange={(key, v) => set(key as keyof Omit<Sides, "linked">, v)}
          min={0}
        />
      )}
    </div>
  );
}

export function CornersInput({
  value,
  onChange,
}: {
  value: Corners;
  onChange: (c: Corners) => void;
}) {
  function set(field: keyof Omit<Corners, "linked">, v: number) {
    const n = Math.max(0, Number.isFinite(v) ? v : 0);
    onChange({ ...value, [field]: n });
  }

  function setLinked(linked: boolean) {
    if (linked) {
      onChange(makeCorners(value.topLeft, true));
    } else {
      onChange({ ...value, linked: false });
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {value.linked ? (
          <Input
            type="number"
            min={0}
            value={value.topLeft}
            onChange={(e) => onChange(makeCorners(Math.max(0, Number(e.target.value)), true))}
            className="h-7 flex-1 text-xs"
          />
        ) : (
          <div className="flex-1" />
        )}
        <ModeToggle linked={value.linked} onChange={setLinked} mode="corners" />
      </div>
      {!value.linked && (
        <SegmentedNumberBar
          min={0}
          segments={[
            { key: "topLeft", label: "TL", value: value.topLeft },
            { key: "topRight", label: "TR", value: value.topRight },
            { key: "bottomLeft", label: "BL", value: value.bottomLeft },
            { key: "bottomRight", label: "BR", value: value.bottomRight },
          ]}
          onChange={(key, v) => set(key as keyof Omit<Corners, "linked">, v)}
        />
      )}
    </div>
  );
}

export function AlignSelect({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <OptionButtonGroup>
      {(["left", "center", "right"] as const).map((a) => (
        <OptionButton
          key={a}
          selected={value === a}
          onClick={() => onChange(a)}
          className="h-7 flex-1 capitalize"
        >
          {a}
        </OptionButton>
      ))}
    </OptionButtonGroup>
  );
}

export function AlignButtons({
  value,
  onChange,
}: {
  value: FlexAlign;
  onChange: (v: FlexAlign) => void;
}) {
  return (
    <OptionButtonGroup>
      {(["start", "center", "end"] as FlexAlign[]).map((a) => (
        <OptionButton
          key={a}
          selected={value === a}
          onClick={() => onChange(a)}
          className="h-7 flex-1 capitalize"
        >
          {a}
        </OptionButton>
      ))}
    </OptionButtonGroup>
  );
}

// Distribute (justify) — main axis, includes space-between / space-evenly.
export function FlexJustifySelect({
  value,
  onChange,
}: {
  value: FlexJustify;
  onChange: (v: FlexJustify) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FlexJustify)}
      className={SELECT_CLASS}
    >
      <option value="start">Start</option>
      <option value="center">Center</option>
      <option value="end">End</option>
      <option value="between">Space between</option>
      <option value="evenly">Space even</option>
    </select>
  );
}

// Cross-axis Align.
export function FlexAlignSelect({
  value,
  onChange,
}: {
  value: FlexAlign;
  onChange: (v: FlexAlign) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FlexAlign)}
      className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs capitalize transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="start">Start</option>
      <option value="center">Center</option>
      <option value="end">End</option>
    </select>
  );
}
