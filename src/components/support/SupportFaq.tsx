import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need to know HTML to use Crema?",
    answer:
      "No. Crema is a visual builder — you design with blocks and export clean HTML automatically. If you do know HTML, you can still copy the output and tweak it elsewhere.",
  },
  {
    question: "Which email clients does exported HTML support?",
    answer:
      "Crema generates table-based, inline-friendly HTML designed for broad inbox compatibility — including Gmail, Outlook, Apple Mail, and most major ESPs.",
  },
  {
    question: "How do I send a test email?",
    answer:
      "Open any template in the editor and use the test-send action in the toolbar. You'll receive the rendered email in your inbox so you can verify layout and links before exporting.",
  },
  {
    question: "What's included on the free plan?",
    answer:
      "The free plan includes up to 3 templates, image URLs via paste, and full HTML export. Upgrade when you need more templates, image uploads, or priority support.",
  },
  {
    question: "How does priority support work?",
    answer:
      "Pro+ subscribers get faster response times via support@cremastudio.work. Free and Pro users can still reach us by email — we aim to reply within one business day.",
  },
  {
    question: "Can I cancel or change my plan anytime?",
    answer:
      "Yes. Manage billing from your dashboard. You can switch between monthly and annual billing or downgrade to free — your templates stay saved to your account.",
  },
];

export function SupportFaq() {
  return (
    <div className="divide-y divide-border/70 rounded-xxl border border-border/70 bg-background/80">
      {FAQ_ITEMS.map((item) => (
        <details key={item.question} className="group">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-md px-lg py-md text-left",
              "[&::-webkit-details-marker]:hidden"
            )}
          >
            <span className="text-headline text-foreground">{item.question}</span>
            <ChevronDown
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="text-body px-lg pb-md text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
