"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { Logo } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "#support" },
];

export function Header() {
  const { data: session } = useSession();
  const loggedIn = !!session?.user;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4">
        <div
          className={cn(
            "relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-300 sm:px-4",
            scrolled
              ? "border-border/70 bg-background/90 shadow-[0_8px_32px_-8px_hsl(var(--foreground)/0.12)] backdrop-blur-xl"
              : "border-border/40 bg-background/60 backdrop-blur-lg"
          )}
        >
          <Logo />

          <nav
            aria-label="Main"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-border/50 bg-muted/30 p-1 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="hidden md:block">
              <UserMenu />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />

      <div
        className={cn(
          "fixed inset-x-4 top-[4.75rem] z-30 overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-xl backdrop-blur-xl transition-all duration-300 md:hidden",
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <nav className="flex flex-col p-2" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border/60 p-3">
          {loggedIn ? (
            <Button asChild className="w-full rounded-full shadow-sm shadow-primary/30">
              <Link href="/dashboard" onClick={closeMobile}>
                Go to dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full rounded-full shadow-sm shadow-primary/30">
                <Link href="/signup" onClick={closeMobile}>
                  Sign up free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/login" onClick={closeMobile}>
                  Log in
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
