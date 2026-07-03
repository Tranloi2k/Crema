type Feature = {
  visual: "drag" | "html" | "style" | "preview" | "templates" | "send";
  title: string;
  desc: string;
  variant: "muted" | "accent";
  span: "sm" | "lg";
};

const FEATURES: Feature[] = [
  {
    visual: "drag",
    title: "Drag & drop builder",
    desc: "Compose emails from blocks — text, image, button, stack — with intuitive nesting and reordering.",
    variant: "muted",
    span: "sm",
  },
  {
    visual: "html",
    title: "Clean HTML export",
    desc: "Ship table-based, inbox-ready HTML that renders consistently across every email client.",
    variant: "accent",
    span: "lg",
  },
  {
    visual: "style",
    title: "Pixel-perfect styling",
    desc: "Per-corner radius, padding, typography and fixed-height text frames — full control, no code.",
    variant: "accent",
    span: "lg",
  },
  {
    visual: "preview",
    title: "Responsive previews",
    desc: "Switch between desktop and mobile to see exactly how your email lands before you send.",
    variant: "muted",
    span: "sm",
  },
  {
    visual: "templates",
    title: "Reusable templates",
    desc: "Save, duplicate and manage templates from a clean dashboard built for speed.",
    variant: "muted",
    span: "sm",
  },
  {
    visual: "send",
    title: "Send a test in a click",
    desc: "Fire off a test email straight from the editor and validate the real thing instantly.",
    variant: "accent",
    span: "lg",
  },
];

const variantStyles = {
  muted: "border border-border/70 bg-muted/40",
  accent: "border border-primary/15 bg-accent",
};

const spanStyles = {
  sm: "lg:col-span-2",
  lg: "lg:col-span-3",
};

function DragVisual({ wide }: { wide?: boolean }) {
  return (
    <div className={`relative ${wide ? "w-full max-w-md" : "w-full"}`}>
      <div className="rounded-lg border border-border/70 bg-background/90 p-sm shadow-sm">
        <div className="mb-xs h-2 w-12 rounded-full bg-muted" />
        <div className="space-y-xs">
          <div className="h-8 rounded-md bg-muted/80" />
          <div className="h-14 rounded-md bg-primary/10" />
        </div>
      </div>
      <div className="absolute -right-2 top-6 w-[42%] rounded-lg border border-primary/30 bg-background p-xs shadow-md shadow-primary/10">
        <div className="mb-xxs h-1.5 w-8 rounded-full bg-primary/20" />
        <div className="h-6 rounded bg-primary/15" />
      </div>
    </div>
  );
}

function HtmlVisual({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-border/70 bg-background/90 p-sm font-mono text-micro leading-relaxed text-muted-foreground shadow-sm ${wide ? "w-full max-w-lg" : "w-full"}`}
    >
      <p>
        <span className="text-primary/70">&lt;table</span>{" "}
        <span className="text-foreground/70">width=&quot;600&quot;</span>
        <span className="text-primary/70">&gt;</span>
      </p>
      <p className="pl-sm">
        <span className="text-primary/70">&lt;tr&gt;&lt;td</span>{" "}
        <span className="text-foreground/70">style=...</span>
        <span className="text-primary/70">&gt;</span>
      </p>
      <p className="pl-lg text-foreground/50">Newsletter content</p>
      <p className="pl-sm">
        <span className="text-primary/70">&lt;/td&gt;&lt;/tr&gt;</span>
      </p>
      <p>
        <span className="text-primary/70">&lt;/table&gt;</span>
      </p>
    </div>
  );
}

function StyleVisual({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`flex items-end gap-sm ${wide ? "w-full max-w-md" : "w-full"}`}
    >
      <div className="flex-1 rounded-lg border border-border/70 bg-background/90 p-sm shadow-sm">
        <div className="mb-sm grid grid-cols-2 gap-xs">
          {["TL", "TR", "BL", "BR"].map((corner) => (
            <div
              key={corner}
              className="flex items-center justify-between rounded-md bg-muted/60 px-xs py-xxs text-micro text-muted-foreground"
            >
              <span>{corner}</span>
              <span className="font-medium text-primary">12</span>
            </div>
          ))}
        </div>
        <div className="h-10 rounded-[12px_4px_16px_8px] border-2 border-dashed border-primary/35 bg-primary/5" />
      </div>
      <div className="w-16 shrink-0 space-y-xs rounded-lg border border-border/70 bg-background/90 p-xs shadow-sm">
        <div className="text-micro text-muted-foreground">Aa</div>
        <div className="h-1 rounded-full bg-muted" />
        <div className="h-1 w-3/4 rounded-full bg-muted" />
        <div className="h-5 rounded bg-primary/15" />
      </div>
    </div>
  );
}

function PreviewVisual({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`flex items-end justify-center gap-sm ${wide ? "w-full" : "w-full"}`}
    >
      <div className="w-[58%] rounded-lg border border-border/70 bg-background/90 p-xs shadow-sm">
        <div className="mb-xs flex gap-xxs">
          <div className="h-1.5 w-1.5 rounded-full bg-muted" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted" />
        </div>
        <div className="space-y-xxs">
          <div className="h-2 rounded bg-muted" />
          <div className="h-8 rounded bg-primary/10" />
          <div className="h-2 w-2/3 rounded bg-muted" />
        </div>
      </div>
      <div className="w-[30%] rounded-[14px] border-2 border-foreground/15 bg-background/90 p-xxs shadow-sm">
        <div className="mx-auto mb-xs h-1 w-6 rounded-full bg-muted" />
        <div className="space-y-xxs">
          <div className="h-1.5 rounded bg-muted" />
          <div className="h-5 rounded bg-primary/10" />
          <div className="h-1.5 w-4/5 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function TemplatesVisual({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`grid grid-cols-2 gap-xs ${wide ? "w-full max-w-xs" : "w-full"}`}
    >
      {["Newsletter", "Promo", "Welcome", "Digest"].map((label, i) => (
        <div
          key={label}
          className={`rounded-md border border-border/70 bg-background/90 p-xs shadow-sm ${i === 0 ? "ring-1 ring-primary/30" : ""}`}
        >
          <div className="mb-xxs h-5 rounded bg-primary/10" />
          <div className="space-y-xxs">
            <div className="h-1 rounded bg-muted" />
            <div className="h-1 w-4/5 rounded bg-muted" />
          </div>
          <p className="text-micro mt-xs truncate text-muted-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function SendVisual({ wide }: { wide?: boolean }) {
  return (
    <div
      className={`flex items-center gap-sm ${wide ? "w-full max-w-sm" : "w-full"}`}
    >
      <div className="flex-1 rounded-lg border border-border/70 bg-background/90 p-sm shadow-sm">
        <div className="mb-xs h-2 w-16 rounded-full bg-muted" />
        <div className="h-10 rounded-md bg-muted/50" />
        <div className="mt-sm flex justify-end">
          <div className="rounded-pill bg-primary px-sm py-xxs text-micro text-primary-foreground">
            Send test
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({
  visual,
  wide,
}: {
  visual: Feature["visual"];
  wide?: boolean;
}) {
  switch (visual) {
    case "drag":
      return <DragVisual wide={wide} />;
    case "html":
      return <HtmlVisual wide={wide} />;
    case "style":
      return <StyleVisual wide={wide} />;
    case "preview":
      return <PreviewVisual wide={wide} />;
    case "templates":
      return <TemplatesVisual wide={wide} />;
    case "send":
      return <SendVisual wide={wide} />;
  }
}

function FeatureCard({ visual, title, desc, variant, span }: Feature) {
  const wide = span === "lg";

  return (
    <article
      className={`flex h-full w-full min-h-[18rem] flex-col rounded-xxl p-xl sm:min-h-[19rem] ${variantStyles[variant]}`}
    >
      <div className="flex flex-1 items-center pb-md">
        <FeatureVisual visual={visual} wide={wide} />
      </div>

      <div>
        <h3 className="text-headline text-foreground">{title}</h3>
        <p className="text-body mt-sm text-muted-foreground">{desc}</p>
      </div>
    </article>
  );
}

export function Features() {
  return (
    <section id="features" className="px-lg py-section">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-xl lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-caption uppercase tracking-[0.12em] text-muted-foreground">
              Everything you need
            </p>
            <h2 className="font-display text-display-md mt-md max-w-lg text-foreground">
              A complete toolkit for email design
            </h2>
          </div>
          <p className="text-body-lg max-w-md text-muted-foreground lg:justify-self-end">
            From the first block to the final send — Crema gives you a fast,
            modern workflow that produces emails that actually look good.
          </p>
        </div>

        <div className="mt-xxl grid gap-lg lg:grid-cols-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`${spanStyles[feature.span]} flex`}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
