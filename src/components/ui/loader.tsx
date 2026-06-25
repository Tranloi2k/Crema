import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />;
}

export function LoadingOverlay({ label }: { label?: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-6 flex items-center justify-between">
        <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
