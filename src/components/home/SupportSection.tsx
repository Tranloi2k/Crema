import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

import { SupportFaq } from "@/components/support/SupportFaq";
import { Button } from "@/components/ui/button";

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    title: "Email support",
    desc: "Questions about billing, exports, or the editor? We read every message.",
    action: "support@cremastudio.work",
    href: "mailto:support@cremastudio.work",
  },
  {
    icon: MessageCircle,
    title: "Priority support",
    desc: "Pro+ subscribers get faster responses. Upgrade from your dashboard billing page.",
    action: "View plans",
    href: "#pricing",
  },
];

export function SupportSection() {
  return (
    <section id="support" className="border-t border-border/60 bg-muted/20 px-lg py-section">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-caption uppercase tracking-[0.12em] text-muted-foreground">
            Support
          </p>
          <h2 className="font-display text-display-md mt-md text-foreground">
            How can we help?
          </h2>
          <p className="text-body-lg mx-auto mt-md max-w-lg text-muted-foreground">
            Browse common questions below or reach out — we&apos;re here to help you
            ship great emails.
          </p>
        </div>

        <div className="mx-auto mt-xxl grid max-w-4xl gap-md sm:grid-cols-2">
          {CONTACT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <article
                key={option.title}
                className="flex flex-col rounded-xxl border border-border/70 bg-background p-xl shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-accent text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-headline mt-lg text-foreground">{option.title}</h3>
                <p className="text-body mt-sm flex-1 text-muted-foreground">{option.desc}</p>
                <Button asChild variant="outline" className="mt-lg w-fit rounded-full">
                  <Link href={option.href}>
                    {option.action}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-xxl max-w-3xl">
          <h3 className="font-display text-display-md text-center text-foreground">
            Frequently asked questions
          </h3>
          <div className="mt-xl">
            <SupportFaq />
          </div>
        </div>
      </div>
    </section>
  );
}
