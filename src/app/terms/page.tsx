import type { Metadata } from "next";

import { ContentSection, MarketingPage } from "@/components/home/MarketingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Read the terms governing Crema accounts, email templates, paid plans, acceptable use, and service availability.",
  path: "/terms",
  keywords: ["Crema terms of service", "email builder terms"],
});

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your access to Crema, including its visual email editor, template storage, HTML export, test-send features, and paid plans. By creating an account or using the service, you agree to these terms."
    >
      <p className="text-sm text-muted-foreground">Effective August 10, 2026</p>

      <ContentSection title="Who may use Crema?">
        <p>
          You must be at least 13 years old and legally able to enter into these terms. If you use
          Crema for an organization, you confirm that you have authority to accept these terms for
          that organization.
        </p>
      </ContentSection>

      <ContentSection title="How should accounts be used?">
        <p>
          Provide accurate account information, keep your sign-in credentials secure, and notify
          us if you suspect unauthorized access. You are responsible for activity performed through
          your account and for maintaining appropriate backups of exported work.
        </p>
      </ContentSection>

      <ContentSection title="Who owns template content?">
        <p>
          You retain ownership of the text, images, links, and other content you add to Crema. You
          grant us a limited license to host, process, reproduce, and transmit that content only as
          needed to operate and improve the service and fulfill your requests.
        </p>
        <p>
          You must have the rights needed to use your content. Crema and its product design,
          software, branding, and documentation remain protected by applicable intellectual
          property laws.
        </p>
      </ContentSection>

      <ContentSection title="What uses are prohibited?">
        <p>
          Do not use Crema to violate law or third-party rights; distribute malware, phishing, spam,
          or deceptive content; probe or disrupt the service; bypass access or plan limits; scrape
          private areas; or help another person do any of those things.
        </p>
      </ContentSection>

      <ContentSection title="How do paid plans and cancellation work?">
        <p>
          Current prices and plan limits appear on the pricing page. Paid subscriptions are handled
          by Lemon Squeezy and renew for the interval selected at checkout until canceled. You can
          manage or cancel a subscription from billing settings. Fees already charged are
          non-refundable except where required by law or expressly stated at purchase.
        </p>
      </ContentSection>

      <ContentSection title="Are exported emails guaranteed to work everywhere?">
        <p>
          No. Crema is designed to produce broadly compatible, inline-friendly HTML, but email
          clients, sending platforms, content, and later edits can affect rendering or delivery.
          You are responsible for previewing, testing, and confirming every email before sending it.
        </p>
      </ContentSection>

      <ContentSection title="Can the service change or end?">
        <p>
          We may add, remove, or change features and limits, suspend access needed to protect the
          service, or discontinue Crema. We may also suspend or terminate accounts that materially
          violate these terms. Where practical, we will provide notice of significant changes.
        </p>
      </ContentSection>

      <ContentSection title="Disclaimers and liability">
        <p>
          Crema is provided on an “as is” and “as available” basis to the extent permitted by law.
          We do not guarantee uninterrupted operation, inbox placement, compatibility with every
          email client, or that the service will meet every requirement.
        </p>
        <p>
          To the extent permitted by law, Crema will not be liable for indirect, incidental,
          special, consequential, or punitive damages, lost profits, lost data, or business
          interruption arising from your use of the service.
        </p>
      </ContentSection>

      <ContentSection title="How can you contact us?">
        <p>
          Questions about these terms can be sent to <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@cremastudio.work">support@cremastudio.work</a>. We may update these terms by posting a revised version on this page and changing the effective date.
        </p>
      </ContentSection>
    </MarketingPage>
  );
}
