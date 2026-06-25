"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dimension, FlexAlign, FlexJustify, Sides, Corners, Unit } from "@/lib/types";
import { UNIT_OPTIONS, SIZE_UNIT_OPTIONS, sides as makeSides, corners as makeCorners } from "@/lib/types";
import { convertDimensionUnit, getParentHeightPxForBlock, getParentWidthPxForBlock } from "@/lib/layout/convertDimension";
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
    <div className={cn("flex gap-2", align === "start" ? "items-start" : "items-center")}>
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
    <button type="button" onClick={onClick} className={optionButtonClass(selected, className)}>
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

export function UnitInput({
  value,
  onChange,
  unitOptions = UNIT_OPTIONS,
  parentSizePx,
}: {
  value: Dimension;
  onChange: (d: Dimension) => void;
  unitOptions?: { label: string; value: Unit }[];
  parentSizePx?: number;
}) {
  const numericDisabled = value.unit === "fit-content" || value.unit === "fill";

  function handleUnitChange(nextUnit: Unit) {
    if (nextUnit === value.unit) return;
    if (parentSizePx !== undefined && parentSizePx > 0) {
      onChange(convertDimensionUnit(value, nextUnit, parentSizePx));
      return;
    }
    onChange({ ...value, unit: nextUnit });
  }

  return (
    <div className="flex w-full gap-1">
      <Input
        type="number"
        value={value.value}
        onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
        disabled={numericDisabled}
        className="h-7 flex-1 text-xs"
      />
      <select
        value={value.unit}
        onChange={(e) => handleUnitChange(e.target.value as Unit)}
        className="h-7 w-24 rounded-md border border-input bg-background px-1.5 text-xs font-medium"
      >
        {unitOptions.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>
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
  const parentPx = getParentHeightPxForBlock(root, blockId);
  return (
    <UnitInput
      value={value}
      onChange={onChange}
      unitOptions={SIZE_UNIT_OPTIONS}
      parentSizePx={parentPx}
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
  const parentPx = getParentWidthPxForBlock(root, blockId);
  return (
    <UnitInput
      value={value}
      onChange={onChange}
      unitOptions={SIZE_UNIT_OPTIONS}
      parentSizePx={parentPx}
    />
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
    onChange({ ...value, [field]: v });
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
            value={value.top}
            onChange={(e) => onChange(makeSides(Number(e.target.value), true))}
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
