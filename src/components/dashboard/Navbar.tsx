"use client";

import { UserMenu } from "@/components/auth/UserMenu";
import { Logo } from "@/components/home/Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur-xl">
      <Logo href="/dashboard" />
      <UserMenu />
    </header>
  );
}
