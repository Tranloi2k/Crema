"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Download,
  Eye,
  Hand,
  ImageIcon,
  Layers,
  Minus,
  MousePointer2,
  MoveVertical,
  Plus,
  RectangleHorizontal,
  Redo2,
  Rows3,
  Send,
  Share2,
  Sparkles,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PALETTE_ITEMS = [
  { label: "Text", icon: Type },
  { label: "Image", icon: ImageIcon },
  { label: "Button", icon: RectangleHorizontal },
  { label: "Divider", icon: Minus },
  { label: "Spacer", icon: MoveVertical },
  { label: "Stack", icon: Rows3 },
  { label: "Social", icon: Share2 },
];

const LAYERS = [
  { depth: 0, label: "Root", active: false },
  { depth: 1, label: "Header", active: false },
  { depth: 2, label: "Title text", active: false },
  { depth: 1, label: "Body", active: false },
  { depth: 2, label: "Hero image", active: false },
  { depth: 2, label: "Story text", active: false },
  { depth: 2, label: "Read more", active: true },
  { depth: 1, label: "Footer", active: false },
];

function MockToolbar() {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-background px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Weekly Newsletter</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Check className="h-3 w-3 text-[hsl(142_70%_45%)]" />
            Saved
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-0.5 sm:flex">
        {[Undo2, Redo2].map((Icon, i) => (
          <div
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </div>
        <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
          <Code2 className="h-3.5 w-3.5" />
          Code
        </div>
        <div className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
          <Download className="h-3.5 w-3.5" />
          Export
        </div>
      </div>
    </div>
  );
}

function MockPaletteBar() {
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto border-b border-border/60 bg-background px-3 py-2 sm:px-4">
      <div className="flex items-center gap-1.5">
        {PALETTE_ITEMS.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm"
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            {label}
          </div>
        ))}
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <div className="h-7 w-36 rounded-full border border-input bg-background px-3 text-[11px] text-muted-foreground/60">
          test@email.com
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm">
          <Send className="h-3.5 w-3.5" />
          Send test
        </div>
      </div>
    </div>
  );
}

function MockLayersPanel() {
  return (
    <div className="hidden h-full flex-col border-r border-border/70 bg-muted/30 md:flex md:w-[168px] lg:w-[192px]">
      <div className="border-b border-border/70 bg-background p-2">
        <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
          <span className="flex-1 rounded-md bg-background px-2 py-1 text-center text-[10px] font-medium text-foreground shadow-sm">
            Layers
          </span>
          <span className="flex-1 px-2 py-1 text-center text-[10px] font-medium text-muted-foreground">
            Variables
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-0.5 p-2">
        {LAYERS.map(({ depth, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}
            style={{ paddingLeft: `${8 + depth * 10}px` }}
          >
            {depth > 0 && <span className="h-1 w-1 rounded-full bg-border" />}
            <Layers className="h-3 w-3 shrink-0 opacity-50" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPropertiesPanel() {
  return (
    <div className="hidden w-[200px] shrink-0 flex-col border-l border-border/70 bg-muted/30 lg:flex lg:w-[220px]">
      <div className="border-b border-border/70 bg-background px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Properties
        </p>
        <p className="text-xs font-semibold text-foreground">Read more button</p>
      </div>

      <div className="flex-1 overflow-hidden text-[11px]">
        <div className="border-b border-border/60">
          <div className="flex items-center justify-between px-3 py-2 font-semibold text-foreground">
            Size
            <Minus className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="space-y-2 px-3 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Width</span>
              <div className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-foreground">
                100%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Height</span>
              <div className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-foreground">
                Auto
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border/60">
          <div className="flex items-center justify-between px-3 py-2 font-semibold text-foreground">
            Padding
            <Minus className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { corner: "TL", val: "12" },
                { corner: "TR", val: "12" },
                { corner: "BL", val: "12" },
                { corner: "BR", val: "12" },
              ].map(({ corner, val }) => (
                <div
                  key={corner}
                  className="flex items-center justify-between rounded-md border border-input bg-background px-2 py-1"
                >
                  <span className="text-muted-foreground">{corner}</span>
                  <span className="font-medium text-primary">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b border-border/60">
          <div className="flex items-center justify-between px-3 py-2 font-semibold text-foreground">
            Radius
            <Minus className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="px-3 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { corner: "TL", val: "24" },
                { corner: "TR", val: "24" },
                { corner: "BL", val: "24" },
                { corner: "BR", val: "24" },
              ].map(({ corner, val }) => (
                <div
                  key={corner}
                  className="flex items-center justify-between rounded-md border border-input bg-background px-2 py-1"
                >
                  <span className="text-muted-foreground">{corner}</span>
                  <span className="font-medium text-primary">{val}</span>
                </div>
              ))}
            </div>
            <div className="h-10 rounded-[24px_24px_24px_24px] border-2 border-dashed border-primary/40 bg-primary/5" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 py-2 font-semibold text-foreground">
            Background
            <Minus className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 px-3 pb-3">
            <div className="h-7 w-7 shrink-0 rounded-md border border-input bg-[#5046e5] shadow-inner" />
            <div className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-[10px] text-foreground">
              #5046e5
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockEmailCanvas() {
  return (
    <div className="relative flex-1 bg-muted/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[320px] overflow-hidden rounded-lg border border-border/60 bg-white shadow-xl shadow-foreground/5">
        <div className="bg-[#5046e5] px-6 py-4 text-center">
          <p className="text-sm font-bold tracking-wide text-white">THE WEEKLY</p>
        </div>

        <div className="space-y-0 bg-white p-0">
          <div className="relative overflow-hidden">
            <div className="h-28 bg-gradient-to-br from-[#5046e5]/30 via-[hsl(263_70%_60%)]/25 to-[hsl(199_89%_55%)]/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.35),transparent_55%)]" />
            </div>
          </div>

          <div className="space-y-3 px-6 py-5">
            <p className="text-base font-bold leading-tight text-gray-900">
              This week&apos;s top story
            </p>
            <p className="text-[11px] leading-relaxed text-gray-500">
              A short, punchy summary of your lead story goes here. Keep it to a couple of
              sentences so readers can scan quickly.
            </p>

            <div className="relative pt-1">
              <div className="absolute -inset-1 rounded-[26px] border-2 border-primary ring-4 ring-primary/15" />
              <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
              <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
              <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
              <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-white shadow-sm" />
              <div className="rounded-[24px] bg-[#5046e5] px-6 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-[#5046e5]/30">
                Read more
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 text-center">
            <p className="text-[10px] text-gray-400">© 2026 Your Company</p>
            <p className="mt-1 text-[10px] text-gray-400">Unsubscribe · 123 Market St</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MousePointer2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
          <Hand className="h-3.5 w-3.5" />
        </div>
        <div className="mx-1 h-4 w-px bg-border" />
        <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">
          <Minus className="h-3.5 w-3.5" />
        </div>
        <span className="w-10 text-center text-[10px] font-medium text-muted-foreground">100%</span>
        <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function BuilderMockup() {
  return (
    <div className="relative mx-auto max-w-6xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -top-16 -z-10 h-72 rounded-full bg-gradient-to-b from-primary/20 via-[hsl(263_70%_60%)]/10 to-transparent blur-3xl"
      />

      <div className="overflow-hidden rounded-xxl border border-border/70 bg-card shadow-[0_32px_64px_-16px_hsl(var(--primary)/0.18),0_0_0_1px_hsl(var(--border)/0.5)] ring-1 ring-border/30 lg:[transform:perspective(1400px)_rotateX(1.5deg)]">
        <MockToolbar />
        <MockPaletteBar />

        <div className="flex min-h-[380px] sm:min-h-[420px] lg:min-h-[460px]">
          <MockLayersPanel />
          <MockEmailCanvas />
          <MockPropertiesPanel />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;

  return (
    <section className="relative overflow-hidden px-lg pb-section pt-24 text-center sm:pt-28 lg:pt-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hero-glow" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />

      <div className="mx-auto max-w-6xl">
        <Link
          href="#features"
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-pill border border-border/70 bg-background/70 px-3 py-1 text-caption text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <span className="flex items-center gap-1 rounded-pill bg-accent px-2 py-0.5 text-micro font-semibold text-accent-foreground">
            <Sparkles className="h-3 w-3" /> New
          </span>
          Per-corner radius & fixed-height text blocks
          <ArrowRight className="h-3 w-3" />
        </Link>

        <h1 className="font-display text-display-md mx-auto max-w-4xl text-foreground sm:text-display-lg">
          Design beautiful emails{" "}
          <span className="brand-gradient-text">without writing HTML</span>
        </h1>
        <p className="text-body-lg mx-auto mt-6 max-w-2xl text-muted-foreground">
          Drag, drop, and ship — Crema turns blocks into pixel-perfect, inbox-ready
          HTML emails in minutes. No templates to wrestle with, no code to debug.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-pill px-6 shadow-md shadow-primary/30">
            <Link href="/dashboard">
              {loggedIn ? "Go to dashboard" : "Start building free"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          {!loggedIn && (
            <Button asChild size="lg" variant="outline" className="rounded-pill px-6">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>

        <p className="text-micro mt-5 text-muted-foreground">
          No credit card required · Export clean HTML · Free to start
        </p>

        <div className="mt-14 sm:mt-16 lg:mt-20">
          <BuilderMockup />
        </div>
      </div>
    </section>
  );
}
