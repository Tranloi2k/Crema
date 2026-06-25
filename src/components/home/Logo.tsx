import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[hsl(263_70%_60%)] text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
        C
      </span>
      <span className="text-lg font-semibold tracking-tight">Crema</span>
    </Link>
  );
}
