import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { FAQ_ITEMS } from "@/components/support/SupportFaq";

export function HomeJsonLd() {
  const websiteId = `${absoluteUrl("/")}#website`;
  const organizationId = `${absoluteUrl("/")}#organization`;
  const applicationId = `${absoluteUrl("/")}#app`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: absoluteUrl("/"),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-US",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": applicationId,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web browser",
        description: SITE_DESCRIPTION,
        url: absoluteUrl("/"),
        isAccessibleForFree: true,
        publisher: { "@id": organizationId },
        featureList: [
          "No-code drag-and-drop email editor",
          "Responsive desktop and mobile previews",
          "Table-based HTML email export",
          "Test email sending",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free to start",
        },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/logo.png"),
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@cremastudio.work",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl("/")}#faq`,
        url: `${absoluteUrl("/")}#support`,
        inLanguage: "en-US",
        isPartOf: { "@id": websiteId },
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
