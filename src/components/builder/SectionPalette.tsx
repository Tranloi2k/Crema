"use client";

import {
  Megaphone,
  Newspaper,
  PanelBottom,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { createPresetSection, type SectionPresetId } from "@/lib/builderPresets";
import { useEditorStore } from "@/lib/store/editorStore";

const SECTION_PRESETS: {
  id: SectionPresetId;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: "hero", label: "Hero", description: "Image, headline and action button", icon: Sparkles },
  { id: "content", label: "Story", description: "Heading and body copy", icon: Newspaper },
  { id: "cta", label: "Call to action", description: "Prompt readers to take the next step", icon: Megaphone },
  { id: "footer", label: "Footer", description: "Social links and legal text", icon: PanelBottom },
];

export function SectionPalette({ onSectionAdded }: { onSectionAdded?: () => void }) {
  const addSection = useEditorStore((state) => state.addSection);

  return (
    <div className="p-3">
      <div className="mb-4 px-1">
        <h3 className="text-sm font-semibold text-foreground">Start with a section</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Add a complete section, then select its content on the canvas to customize it.
        </p>
      </div>

      <div className="grid gap-2">
        {SECTION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                addSection(createPresetSection(preset.id));
                onSectionAdded?.();
              }}
              className="group flex min-h-20 w-full items-center gap-3 rounded-xl border bg-gradient-to-br from-card to-muted/40 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground">{preset.label}</span>
                <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{preset.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-muted/30 px-3 py-2.5 text-[11px] leading-4 text-muted-foreground">
        Need more control? Switch to <span className="font-semibold text-foreground">Blocks</span> to build from individual elements.
      </div>
    </div>
  );
}
