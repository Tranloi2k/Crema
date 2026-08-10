import type { Metadata } from "next";

import { ContentSection, MarketingPage } from "@/components/home/MarketingPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Read how Crema collects, uses, shares, and protects account, template, billing, and usage information.",
  path: "/privacy",
  keywords: ["Crema privacy policy", "email builder privacy"],
});

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what information Crema processes when you visit the website, create an account, build email templates, send tests, or purchase a paid plan. It also explains the choices available to you."
    >
      <p className="text-sm text-muted-foreground">Effective August 10, 2026</p>

      <ContentSection title="What information does Crema collect?">
        <p>
          We process account details such as your name, email address, profile image, and
          authentication provider; the templates and settings you save; uploaded image
          references; test-email details; subscription status; and support messages you send.
        </p>
        <p>
          We may also receive technical and usage information such as device, browser, IP
          address, pages viewed, and diagnostic events through server logs and analytics.
        </p>
      </ContentSection>

      <ContentSection title="How does Crema use information?">
        <p>
          We use information to authenticate accounts, save and export templates, deliver test
          emails, process subscriptions, provide support, prevent abuse, diagnose problems, and
          understand how the product is used so we can improve it.
        </p>
      </ContentSection>

      <ContentSection title="Which service providers receive information?">
        <p>
          Crema relies on service providers for hosting and infrastructure, database storage,
          authentication, image hosting, email delivery, analytics, and subscription billing.
          Depending on the feature you use, these providers may include Google, GitHub, Turso,
          Cloudinary, Resend, Google Analytics, and Lemon Squeezy. They process information under
          their own terms and privacy policies.
        </p>
      </ContentSection>

      <ContentSection title="Does Crema sell personal information?">
        <p>
          No. Crema does not sell your personal information. We share information only as needed
          to operate the service, comply with law, protect rights and safety, or complete a
          business transaction with appropriate safeguards.
        </p>
      </ContentSection>

      <ContentSection title="How long is information retained?">
        <p>
          We retain account and template information while your account is active and for as
          long as reasonably needed to operate the service, resolve disputes, meet legal or
          accounting obligations, and prevent abuse. Retention periods can differ by data type
          and service provider.
        </p>
      </ContentSection>

      <ContentSection title="What choices do you have?">
        <p>
          You can update available account details from your profile and manage or cancel a paid
          plan from billing settings. To request access, correction, export, or deletion of your
          personal information, email support@cremastudio.work. We may need to verify your identity
          before completing a request.
        </p>
      </ContentSection>

      <ContentSection title="Cookies and analytics">
        <p>
          Crema uses essential browser storage and cookies for sign-in, security, and session
          continuity. Google Analytics may use cookies or similar technologies to measure visits
          and product usage. Browser settings can limit non-essential cookies, though blocking
          essential storage may prevent some features from working.
        </p>
      </ContentSection>

      <ContentSection title="Security and children">
        <p>
          We use reasonable technical and organizational measures intended to protect information,
          but no online service can guarantee absolute security. Crema is not directed to children
          under 13, and we do not knowingly collect their personal information.
        </p>
      </ContentSection>

      <ContentSection title="Policy changes and contact">
        <p>
          We may update this policy as the product or legal requirements change. We will post the
          revised version here and update its effective date. Questions or privacy requests can be
          sent to <a className="text-primary underline-offset-4 hover:underline" href="mailto:support@cremastudio.work">support@cremastudio.work</a>.
        </p>
      </ContentSection>
    </MarketingPage>
  );
}
