const DEFAULT_AUTH_CALLBACK_URL = "/dashboard";
const MAX_AUTH_CALLBACK_URL_LENGTH = 2048;

export function getSafeAuthCallbackUrl(
  value: string | null,
  fallback = DEFAULT_AUTH_CALLBACK_URL,
): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.length > MAX_AUTH_CALLBACK_URL_LENGTH
  ) {
    return fallback;
  }

  return value;
}
