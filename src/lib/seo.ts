import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/appUrl";

export const SITE_NAME = "Crema";

export const SITE_TITLE_DEFAULT =
  "Crema - Email Template Builder, No Code Drag & Drop";

export const SITE_TITLE_TEMPLATE = "%s | Crema";

export const SITE_TAGLINE = "No-code drag & drop email builder";

export const SITE_DESCRIPTION =
  "Build beautiful, inbox-ready HTML emails without code. Drag, drop, and ship responsive email templates in minutes with Crema.";

export const SITE_OG_TITLE = "Crema - No-Code Email Template Builder";

export const SITE_OG_DESCRIPTION =
  "The drag-and-drop builder for inbox-ready emails. Design, preview across clients, and export clean HTML in minutes.";

export const SITE_TWITTER_TITLE = "Crema - Email Template Builder, No Code";

export const SITE_TWITTER_DESCRIPTION =
  "Build beautiful, inbox-ready HTML emails without code. Ship responsive templates in minutes.";

export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Crema email builder",
};

export const DEFAULT_KEYWORDS = [
  "email builder",
  "email template builder",
  "HTML email editor",
  "no code email builder",
  "responsive email template",
  "drag and drop email builder",
  "email design tool",
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
  const isHome = path === "/" && !title;
  const url = absoluteUrl(path);
  const pageTitle = title ?? SITE_TITLE_DEFAULT;
  const ogTitle = isHome ? SITE_OG_TITLE : `${pageTitle} | ${SITE_NAME}`;
  const ogDescription = isHome ? SITE_OG_DESCRIPTION : description;
  const twitterTitle = isHome ? SITE_TWITTER_TITLE : `${pageTitle} | ${SITE_NAME}`;
  const twitterDescription = isHome ? SITE_TWITTER_DESCRIPTION : description;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: title ?? SITE_TITLE_DEFAULT,
    description,
    keywords,
    icons: {
      icon: "/logo.png",
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
    applicationName: SITE_NAME,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [OG_IMAGE.url],
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
