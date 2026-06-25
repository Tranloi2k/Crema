"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;

  return (
    <section id="pricing" className="px-6 pb-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[hsl(263_70%_55%)] px-8 py-16 text-center text-primary-foreground shadow-xl shadow-primary/20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]"
        />
        <h2 className="relative text-2xl font-semibold tracking-tight sm:text-4xl">
          Ready to build your first email?
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-primary-foreground/80 sm:text-base">
          No credit card, no setup — just open the builder and start dragging blocks.
        </p>
        <Button
          asChild
          size="lg"
          variant="secondary"
          className="relative mt-8 rounded-full bg-background px-6 text-foreground hover:bg-background/90"
        >
          <Link href={loggedIn ? "/dashboard" : "/signup"}>
            {loggedIn ? "Go to dashboard" : "Get started for free"}
          </Link>
        </Button>
      </div>
    </section>
  );
}
