import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/appUrl";

export const SITE_NAME = "Crema";

export const SITE_TAGLINE = "Drag-and-drop email builder";

export const SITE_DESCRIPTION =
  "Design beautiful, inbox-ready HTML emails without writing code. Drag, drop, and ship pixel-perfect email templates in minutes.";

export const DEFAULT_KEYWORDS = [
  "email builder",
  "drag and drop email",
  "HTML email editor",
  "email template builder",
  "newsletter design",
  "email marketing tool",
  "no-code email",
  "inbox-ready HTML",
];

export function getSiteUrl(): string {
  return getAppBaseUrl();
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (path === "/" || path === "") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  noIndex = false,
  keywords = DEFAULT_KEYWORDS,
}: PageMetadataOptions = {}): Metadata {
  const pageTitle = title ?? `${SITE_NAME} - ${SITE_TAGLINE}`;
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: pageTitle,
    description,
    keywords,
    applicationName: SITE_NAME,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: pageTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
