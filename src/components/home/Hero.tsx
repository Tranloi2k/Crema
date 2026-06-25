"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center sm:pt-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hero-glow" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />

      <Link
        href="#features"
        className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
          <Sparkles className="h-3 w-3" /> New
        </span>
        Per-corner radius & fixed-height text blocks
        <ArrowRight className="h-3 w-3" />
      </Link>

      <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
        Design beautiful emails{" "}
        <span className="brand-gradient-text">without writing HTML</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
        Drag, drop, and ship — Crema turns blocks into pixel-perfect, inbox-ready
        HTML emails in minutes.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="rounded-full px-6 shadow-md shadow-primary/30">
          <Link href={loggedIn ? "/dashboard" : "/signup"}>
            {loggedIn ? "Go to dashboard" : "Start building free"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        {!loggedIn && (
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        No credit card required · Export clean HTML · Free to start
      </p>

      <div className="relative mx-auto mt-16 max-w-4xl">
        <div className="absolute -inset-x-8 -top-8 -z-10 h-40 bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
          <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(38_92%_60%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(142_70%_45%)]" />
            <span className="ml-3 text-xs text-muted-foreground">crema · email builder</span>
          </div>
          <div className="grid grid-cols-[140px_1fr_180px] gap-px bg-border/70 text-left">
            <div className="space-y-2 bg-card p-4">
              {["Text", "Image", "Button", "Divider", "Stack"].map((b) => (
                <div
                  key={b}
                  className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  {b}
                </div>
              ))}
            </div>
            <div className="bg-muted/30 p-6">
              <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="h-24 rounded-lg bg-gradient-to-br from-primary/20 to-[hsl(263_70%_60%)]/20" />
                <div className="h-3 w-2/3 rounded bg-foreground/80" />
                <div className="h-2 w-full rounded bg-muted-foreground/30" />
                <div className="h-2 w-5/6 rounded bg-muted-foreground/30" />
                <div className="mt-2 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                  Call to action
                </div>
              </div>
            </div>
            <div className="space-y-3 bg-card p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Properties
              </div>
              {[60, 90, 45, 75].map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/30" />
                  <div className="h-6 rounded-md border border-border/70 bg-background" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
