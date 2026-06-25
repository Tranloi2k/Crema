import {
  MousePointerClick,
  Code2,
  LayoutTemplate,
  Smartphone,
  Palette,
  Send,
} from "lucide-react";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Drag & drop builder",
    desc: "Compose emails from blocks — text, image, button, stack — with intuitive nesting and reordering.",
  },
  {
    icon: Code2,
    title: "Clean HTML export",
    desc: "Ship table-based, inbox-ready HTML that renders consistently across every email client.",
  },
  {
    icon: Palette,
    title: "Pixel-perfect styling",
    desc: "Per-corner radius, padding, typography and fixed-height text frames — full control, no code.",
  },
  {
    icon: Smartphone,
    title: "Responsive previews",
    desc: "Switch between desktop and mobile to see exactly how your email lands before you send.",
  },
  {
    icon: LayoutTemplate,
    title: "Reusable templates",
    desc: "Save, duplicate and manage templates from a clean dashboard built for speed.",
  },
  {
    icon: Send,
    title: "Send a test in a click",
    desc: "Fire off a test email straight from the editor and validate the real thing instantly.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-border/70 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Everything you need
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            A complete toolkit for email design
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From the first block to the final send — Crema gives you a fast,
            modern workflow that produces emails that actually look good.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
