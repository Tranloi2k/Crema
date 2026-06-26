"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayersPanel } from "@/components/builder/LayersPanel";
import { VariablesPanel } from "@/components/builder/VariablesPanel";

export function LeftPanel() {
  return (
    <Tabs defaultValue="layers" className="flex h-full flex-col">
      <div className="border-b bg-background p-2">
        <TabsList className="w-full">
          <TabsTrigger value="layers" className="flex-1 text-xs">
            Layers
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex-1 text-xs">
            Variables
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="layers" className="m-0 flex-1 overflow-y-auto">
        <LayersPanel />
      </TabsContent>
      <TabsContent value="variables" className="m-0 flex-1 overflow-y-auto">
        <VariablesPanel />
      </TabsContent>
    </Tabs>
  );
}
