// Social platforms for the Social Icons block. Icons are served from the
// Iconify CDN (Remix Icon set) as monochrome SVGs tinted with the block's icon
// color, so a single source of truth (platform + color) drives both the canvas
// and the email export. Remix Icon covers every platform reliably (unlike the
// SimpleIcons CDN, which 404s on linkedin and other trademarked brands).

export type SocialPlatform =
  | "facebook"
  | "x"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "github";

export interface SocialItem {
  platform: SocialPlatform;
  href: string;
}

export type SocialContent = {
  /** Current format: one Social block owns the complete icon group. */
  items?: SocialItem[];
  /** Legacy single-icon fields kept readable for previously saved templates. */
  platform?: SocialPlatform;
  href?: string;
};

export const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  { label: string; icon: string; defaultHref: string }
> = {
  facebook: { label: "Facebook", icon: "ri/facebook-fill", defaultHref: "https://facebook.com" },
  x: { label: "X (Twitter)", icon: "ri/twitter-x-fill", defaultHref: "https://x.com" },
  instagram: { label: "Instagram", icon: "ri/instagram-fill", defaultHref: "https://instagram.com" },
  linkedin: { label: "LinkedIn", icon: "ri/linkedin-fill", defaultHref: "https://linkedin.com" },
  youtube: { label: "YouTube", icon: "ri/youtube-fill", defaultHref: "https://youtube.com" },
  tiktok: { label: "TikTok", icon: "ri/tiktok-fill", defaultHref: "https://tiktok.com" },
  github: { label: "GitHub", icon: "ri/github-fill", defaultHref: "https://github.com" },
};

export const SOCIAL_PLATFORM_LIST = Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[];

export function getSocialItems(content: SocialContent): SocialItem[] {
  if (content.items?.length) return content.items;
  if (content.platform) {
    return [{
      platform: content.platform,
      href: content.href ?? SOCIAL_PLATFORMS[content.platform].defaultHref,
    }];
  }
  return [];
}

/**
 * Iconify CDN URL for a platform's icon, tinted with `hexColor` and rendered at
 * `size` px (for crisp output). Works in the browser canvas and webmail; in
 * clients that strip SVG the icon's alt text shows instead.
 */
export function socialIconUrl(
  platform: SocialPlatform,
  hexColor: string,
  size?: number
): string {
  const icon = SOCIAL_PLATFORMS[platform]?.icon ?? "ri/global-line";
  const color = encodeURIComponent(hexColor || "#000000");
  const sizeParam = size ? `&width=${size}&height=${size}` : "";
  return `https://api.iconify.design/${icon}.svg?color=${color}${sizeParam}`;
}
