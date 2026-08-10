"use client";

import {
  formatMergeTag,
  getMergeTagProvider,
  MERGE_TAG_PROVIDERS,
} from "@/lib/mergeTags/providers";
import type { MergeTagProviderId } from "@/lib/mergeTags/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { cn } from "@/lib/utils";

export function MergeTagInsertMenu({
  onInsert,
  className,
}: {
  onInsert: (tag: string) => void;
  className?: string;
}) {
  const providerId = useEditorStore((s) => s.mergeTagProvider);
  const provider = getMergeTagProvider(providerId);

  return (
    <select
      value=""
      onChange={(e) => {
        const id = e.target.value;
        if (!id) return;
        onInsert(formatMergeTag(providerId, id));
        e.target.value = "";
      }}
      className={cn(
        "h-7 max-w-[5.5rem] shrink-0 rounded-md border border-input bg-background px-1.5 text-[10px] text-muted-foreground",
        className
      )}
      title={`Insert ${provider.name} variable`}
    >
      <option value="">Personalized field</option>
      {provider.variables.map((v) => (
        <option key={v.id} value={v.id}>
          {v.label}
        </option>
      ))}
    </select>
  );
}

export function VariablesPanel() {
  const providerId = useEditorStore((s) => s.mergeTagProvider);
  const setMergeTagProvider = useEditorStore((s) => s.setMergeTagProvider);
  const insertMergeTag = useEditorStore((s) => s.insertMergeTag);
  const provider = getMergeTagProvider(providerId);

  return (
    <div className="flex flex-col gap-0 p-3">
      <div className="mb-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Mail provider</p>
        <select
          value={providerId}
          onChange={(e) => setMergeTagProvider(e.target.value as MergeTagProviderId)}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
        >
          {MERGE_TAG_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{provider.description}</p>
      </div>

      <p className="mb-1 text-xs font-medium text-foreground">Personalized fields</p>
      <p className="mb-3 text-[11px] leading-4 text-muted-foreground">
        Insert details such as a subscriber&apos;s name. Your email platform fills them in when sending.
      </p>
      <ul className="flex flex-col gap-1">
        {provider.variables.map((variable) => {
          const tag = provider.format(variable.id);
          return (
            <li key={variable.id}>
              <button
                type="button"
                onClick={() => insertMergeTag(tag)}
                className="group flex w-full flex-col rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-muted/60"
              >
                <span className="text-xs font-medium text-foreground">{variable.label}</span>
                <code className="mt-0.5 truncate font-mono text-[10px] text-primary">{tag}</code>
                {variable.description && (
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {variable.description}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        Click a field to insert it into the selected text block, or use the personalized-field button in
        properties. Exported HTML keeps the raw syntax for your ESP.
      </p>
    </div>
  );
}
