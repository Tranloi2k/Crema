import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ContentSection, MarketingPage } from "@/components/home/MarketingPage";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "Learn why Crema makes responsive HTML email design faster with a visual, no-code builder and clean HTML export.",
  path: "/about",
  keywords: [
    "about Crema",
    "visual HTML email builder",
    "no-code email design",
    "email template editor",
  ],
});

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About Crema"
      title="A simpler way to build HTML emails"
      intro="Crema is a visual email template builder for people who want polished, responsive emails without hand-coding every table and style. Arrange reusable blocks, check desktop and mobile layouts, send a test, and export clean HTML for your email platform."
    >
      <ContentSection title="What is Crema?">
        <p>
          Crema is a browser-based, no-code email builder. It turns the content and styles
          you arrange visually into table-based, inline-friendly HTML that can be exported
          and used with an email service provider.
        </p>
      </ContentSection>

      <ContentSection title="Who is Crema for?">
        <p>
          Crema is designed for founders, marketers, designers, and developers who need to
          create campaign or transactional email layouts quickly. The free plan is enough to
          start building and exporting templates without a credit card.
        </p>
      </ContentSection>

      <ContentSection title="Why does Crema export table-based HTML?">
        <p>
          Email clients do not interpret modern web layouts consistently. Table-based markup
          and inline-friendly styles remain a practical foundation for broad inbox support,
          so Crema generates that structure while you work in a visual editor.
        </p>
      </ContentSection>

      <ContentSection title="How can I contact Crema?">
        <p>
          Email <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@cremastudio.work">support@cremastudio.work</a> for product, billing, or account questions.
        </p>
      </ContentSection>

      <Button asChild size="lg" className="rounded-full">
        <Link href="/signup">
          Start building free
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    </MarketingPage>
  );
}
