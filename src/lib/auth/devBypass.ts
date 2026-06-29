const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLocalHostUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return LOCAL_HOSTNAMES.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Dev bypass login ("Continue as Dev User") — local `npm run dev` only.
 * Never enabled on Vercel (preview/production) or non-localhost URLs.
 * Set ALLOW_DEV_BYPASS=false to force off even on localhost.
 */
export function isDevBypassEnabled(): boolean {
  if (process.env.ALLOW_DEV_BYPASS === "false") return false;
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.VERCEL === "1") return false;

  const appUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3001";

  return isLocalHostUrl(appUrl);
}
