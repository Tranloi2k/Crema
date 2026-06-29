import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Download,
  LayoutTemplate,
  Send,
} from "lucide-react";

type Step = {
  number: string;
  icon: typeof Blocks;
  title: string;
  desc: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: LayoutTemplate,
    title: "Pick a starting point",
    desc: "Open a preset template from the dashboard or start with a blank canvas — no setup required.",
  },
  {
    number: "02",
    icon: Blocks,
    title: "Design with blocks",
    desc: "Drag text, images, buttons, and stacks onto the canvas. Tweak spacing, typography, and radius in the properties panel.",
  },
  {
    number: "03",
    icon: Send,
    title: "Preview & test send",
    desc: "Switch between desktop and mobile views, then fire a test email straight from the editor to see the real thing.",
  },
  {
    number: "04",
    icon: Download,
    title: "Export clean HTML",
    desc: "Copy inbox-ready, table-based HTML and drop it into your ESP, CRM, or codebase — renders consistently everywhere.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-border/60 bg-muted/20 px-lg py-section">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-xl lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-caption uppercase tracking-[0.12em] text-muted-foreground">
              How it works
            </p>
            <h2 className="font-display text-display-md mt-md max-w-lg text-foreground">
              From blank canvas to inbox in four steps
            </h2>
          </div>
          <div className="text-body-lg max-w-md text-muted-foreground lg:justify-self-end">
            <p>
              Crema keeps the workflow simple — design visually, validate with a real
              send, then export HTML you can ship today.
            </p>
            <Link
              href="#support"
              className="mt-md inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
            >
              Need help? Visit support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <ol className="mt-xxl grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="flex flex-col">
                <article className="flex h-full flex-col rounded-xxl border border-border/70 bg-background p-xl shadow-sm">
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-accent text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-caption font-semibold tabular-nums text-muted-foreground/50">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-headline mt-lg text-foreground">{step.title}</h3>
                  <p className="text-body mt-sm flex-1 text-muted-foreground">{step.desc}</p>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
