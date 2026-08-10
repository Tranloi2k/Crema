"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockPalette } from "@/components/builder/BlockPalette";
import { SectionPalette } from "@/components/builder/SectionPalette";
import { LayersPanel } from "@/components/builder/LayersPanel";
import { VariablesPanel } from "@/components/builder/VariablesPanel";
import { Blocks, Braces, Layers3, LayoutTemplate } from "lucide-react";

export function LeftPanel({ onBlockAdded }: { onBlockAdded?: () => void }) {
  return (
    <Tabs defaultValue="sections" className="flex h-full flex-col bg-background">
      <div className="border-b px-3 pb-2 pt-3">
        <div className="mb-3 px-1">
          <h2 className="text-sm font-semibold text-foreground">Build your email</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Start with a section or add one item at a time.
          </p>
        </div>
        <TabsList data-tour="add-content" className="grid h-auto w-full grid-cols-4">
          <TabsTrigger value="sections" title="Ready-made sections" className="flex-col gap-0.5 px-1 py-1.5 text-[10px]">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="blocks" title="Individual blocks" className="flex-col gap-0.5 px-1 py-1.5 text-[10px]">
            <Blocks className="h-3.5 w-3.5" />
            Blocks
          </TabsTrigger>
          <TabsTrigger value="layers" title="Email structure" className="flex-col gap-0.5 px-1 py-1.5 text-[10px]">
            <Layers3 className="h-3.5 w-3.5" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="variables" title="Personalized fields" className="flex-col gap-0.5 px-1 py-1.5 text-[10px]">
            <Braces className="h-3.5 w-3.5" />
            Fields
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="sections" className="m-0 flex-1 overflow-y-auto">
        <SectionPalette onSectionAdded={onBlockAdded} />
      </TabsContent>
      <TabsContent value="blocks" className="m-0 flex-1 overflow-y-auto">
        <BlockPalette onBlockAdded={onBlockAdded} />
      </TabsContent>
      <TabsContent value="layers" className="m-0 flex-1 overflow-y-auto">
        <LayersPanel />
      </TabsContent>
      <TabsContent value="variables" className="m-0 flex-1 overflow-y-auto">
        <VariablesPanel />
      </TabsContent>
    </Tabs>
  );
}
