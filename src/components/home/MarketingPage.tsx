import type { ReactNode } from "react";
import { Footer } from "@/components/home/Footer";
import { Header } from "@/components/home/Header";

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function MarketingPage({ eyebrow, title, intro, children }: MarketingPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-lg pb-section pt-32 sm:pt-36">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-border/70 pb-xl">
            <p className="text-caption uppercase tracking-[0.12em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="font-display text-display-md mt-md text-foreground sm:text-display-lg">
              {title}
            </h1>
            <p className="text-body-lg mt-lg text-muted-foreground">{intro}</p>
          </header>
          <div className="mt-xl space-y-xl">{children}</div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-sm">
      <h2 className="font-display text-headline text-foreground">{title}</h2>
      <div className="space-y-sm text-body leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
