/** Patterns used by ESPs for personalization tokens */
export const MERGE_TAG_REGEX =
  /\{\{\s*[^}]+\s*\}\}|\{%\s*[^%]+\s*%\}|\*\|[A-Za-z0-9_:]+\|\*/g;

export function containsMergeTags(text: string): boolean {
  MERGE_TAG_REGEX.lastIndex = 0;
  return MERGE_TAG_REGEX.test(text);
}
