"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Lock } from "lucide-react";

import { useEditorStore, findBlock } from "@/lib/store/editorStore";
import { normalizeRoot } from "@/lib/defaultBlocks";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useEditorShortcuts } from "@/lib/hooks/useEditorShortcuts";
import { LeftPanel } from "@/components/builder/LeftPanel";
import { BlockPaletteBar, PaletteDragGhost } from "@/components/builder/BlockPalette";
import { Canvas } from "@/components/builder/Canvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { Toolbar } from "@/components/builder/Toolbar";
import { PreviewModal } from "@/components/builder/PreviewModal";
import { ZoomToolbar, type Tool } from "@/components/builder/ZoomToolbar";
import { LoadingOverlay } from "@/components/ui/loader";
import { resolveDropTarget } from "@/lib/dnd/resolveDrop";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { Block, BlockType, StackBlock } from "@/lib/types";

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  // Blocks dragged out of the palette must land *inside* a droppable (a stack
  // scope). If the pointer is outside every droppable, return no collision so
  // the drop is cancelled instead of snapping to the nearest container.
  if (args.active?.data.current?.source === "palette") return [];
  return closestCorners(args);
};

function getContainerArray(root: StackBlock, containerId: string): Block[] {
  if (containerId === root.id) return root.children;
  const found = findBlock(root, containerId);
  return found && found.type === "stack" ? found.children : [];
}

export default function EditorPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = params.templateId;

  const root = useEditorStore((s) => s.root);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const addBlock = useEditorStore((s) => s.addBlock);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const moveBlock = useEditorStore((s) => s.moveBlock);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paletteDragType, setPaletteDragType] = useState<BlockType | null>(null);
  const [locked, setLocked] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);

  const readOnly = locked;

  useAutosave(loaded && !readOnly ? templateId : null);
  useEditorShortcuts();

  useEffect(() => {
    Promise.all([fetch(`/api/templates/${templateId}`), fetch("/api/billing/usage")])
      .then(async ([templateRes, usageRes]) => {
        const templateData = await parseJsonResponse<{
          id: string;
          name: string;
          content: StackBlock;
          locked?: boolean;
        }>(templateRes);
        const usageData = await parseJsonResponse<{
          limits: { maxImagesPerTemplate: number };
        }>(usageRes);

        if (templateData?.id) {
          loadTemplate(templateData.id, templateData.name, normalizeRoot(templateData.content));
          setLocked(!!templateData.locked);
        }
        if (usageData?.limits) {
          setCanUpload(usageData.limits.maxImagesPerTemplate > 0);
        }
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { source?: string; blockType?: BlockType }
      | undefined;
    setPaletteDragType(data?.source === "palette" && data.blockType ? data.blockType : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setPaletteDragType(null);
    if (readOnly) return;

    const { active } = event;
    const target = resolveDropTarget(event, root, (id) => getContainerArray(root, id));
    if (!target) return;

    const { containerId, index, appendIntoStack } = target;
    const activeData = active.data.current as
      | { source?: string; blockType?: BlockType; containerId?: string }
      | undefined;

    if (activeData?.source === "palette" && activeData.blockType) {
      addBlock(activeData.blockType, containerId, index);
      return;
    }

    if (!activeData?.containerId || active.id === event.over?.id) return;

    if (activeData.containerId === containerId && !appendIntoStack) {
      reorderBlocks(containerId, active.id as string, event.over!.id as string);
      return;
    }

    moveBlock(active.id as string, containerId, index);
  }

  const selectedBlock = selectedBlockId ? findBlock(root, selectedBlockId) : null;

  if (!loaded) {
    return <LoadingOverlay label="Loading template..." />;
  }

  const editorBody = (
    <div className="flex h-screen flex-col">
      {readOnly && (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          This template is locked on your current plan. You can preview and export only.
        </div>
      )}
      <Toolbar onPreview={() => setPreviewOpen(true)} readOnly={readOnly} />
      <div className="flex flex-1 overflow-hidden">
        {!readOnly && (
          <aside className="flex w-64 flex-col overflow-hidden border-r bg-muted/30">
            <LeftPanel />
          </aside>
        )}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-muted/60">
          {!readOnly && <BlockPaletteBar />}
          <div className="relative flex-1 overflow-hidden">
            <Canvas root={root} zoom={zoom} tool={tool} />
            <ZoomToolbar tool={tool} onToolChange={setTool} zoom={zoom} onZoomChange={setZoom} />
          </div>
        </main>
        {!readOnly ? (
          <aside className="w-72 overflow-y-auto border-l bg-muted/30">
            <PropertiesPanel
              block={selectedBlock}
              templateId={templateId}
              canUpload={canUpload}
            />
          </aside>
        ) : (
          <aside className="flex w-72 items-center justify-center border-l bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Properties are disabled while this template is locked.
          </aside>
        )}
      </div>
    </div>
  );

  return (
    <>
      {readOnly ? (
        editorBody
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setPaletteDragType(null)}
        >
          {editorBody}
          <DragOverlay dropAnimation={null}>
            {paletteDragType ? <PaletteDragGhost type={paletteDragType} /> : null}
          </DragOverlay>
        </DndContext>
      )}
      <PreviewModal root={root} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
