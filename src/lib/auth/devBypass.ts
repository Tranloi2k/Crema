/**
 * Dev bypass login ("Continue as Dev User").
 * - Local dev: on by default.
 * - Production: off unless ALLOW_DEV_BYPASS=true (temporary staging tests only).
 */
export function isDevBypassEnabled(): boolean {
  if (process.env.ALLOW_DEV_BYPASS === "true") return true;
  if (process.env.ALLOW_DEV_BYPASS === "false") return false;
  return process.env.NODE_ENV === "development";
}
