import type { MergeTagProviderId } from "@/lib/mergeTags/types";
import { getMergeTagProvider } from "@/lib/mergeTags/providers";
import { MERGE_TAG_REGEX } from "@/lib/mergeTags/patterns";

export function buildSampleSubstitutionMap(providerId: MergeTagProviderId): Map<string, string> {
  const provider = getMergeTagProvider(providerId);
  const map = new Map<string, string>();
  for (const variable of provider.variables) {
    map.set(provider.format(variable.id), variable.sample);
  }
  return map;
}

export function substituteMergeTags(
  html: string,
  providerId: MergeTagProviderId,
  extra?: Record<string, string>
): string {
  const samples = buildSampleSubstitutionMap(providerId);
  if (extra) {
    for (const [tag, value] of Object.entries(extra)) {
      samples.set(tag, value);
    }
  }

  return html.replace(MERGE_TAG_REGEX, (match) => samples.get(match) ?? match);
}
