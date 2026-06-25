"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockPalette } from "@/components/builder/BlockPalette";
import { LayersPanel } from "@/components/builder/LayersPanel";
import { VariablesPanel } from "@/components/builder/VariablesPanel";

export function LeftPanel() {
  return (
    <Tabs defaultValue="blocks" className="flex h-full flex-col">
      <div className="border-b bg-background p-2">
        <TabsList className="w-full">
          <TabsTrigger value="blocks" className="flex-1 text-xs">
            Blocks
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex-1 text-xs">
            Variables
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex-1 text-xs">
            Layers
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="blocks" className="m-0 flex-1 overflow-y-auto">
        <BlockPalette />
      </TabsContent>
      <TabsContent value="variables" className="m-0 flex-1 overflow-y-auto">
        <VariablesPanel />
      </TabsContent>
      <TabsContent value="layers" className="m-0 flex-1 overflow-y-auto">
        <LayersPanel />
      </TabsContent>
    </Tabs>
  );
}
