"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Blocks, Lock, SlidersHorizontal, X } from "lucide-react";

import { useEditorStore, findBlock } from "@/lib/store/editorStore";
import { createRootBlock, normalizeRoot } from "@/lib/defaultBlocks";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useGuestDraftAutosave } from "@/lib/hooks/useGuestDraftAutosave";
import { useEditorShortcuts } from "@/lib/hooks/useEditorShortcuts";
import { LeftPanel } from "@/components/builder/LeftPanel";
import { PaletteDragGhost } from "@/components/builder/BlockPalette";
import { Canvas } from "@/components/builder/Canvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";
import { Toolbar } from "@/components/builder/Toolbar";
import { PreviewModal } from "@/components/builder/PreviewModal";
import { EditorOnboarding } from "@/components/builder/EditorOnboarding";
import { EditorChecklist } from "@/components/builder/EditorChecklist";
import { ZoomToolbar, type Tool } from "@/components/builder/ZoomToolbar";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loader";
import { resolveDropTarget } from "@/lib/dnd/resolveDrop";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import type { Block, BlockType, StackBlock } from "@/lib/types";
import { deleteGuestDraft, getGuestDraft, saveGuestDraft } from "@/lib/guestDrafts";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const { status } = useSession();
  const templateId = params.templateId;

  const root = useEditorStore((s) => s.root);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const addBlock = useEditorStore((s) => s.addBlock);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const name = useEditorStore((s) => s.name);
  const markSaved = useEditorStore((s) => s.markSaved);
  const dirty = useEditorStore((s) => s.dirty);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paletteDragType, setPaletteDragType] = useState<BlockType | null>(null);
  const [locked, setLocked] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [isGuestDraft, setIsGuestDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [hasSentTest, setHasSentTest] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"build" | "properties" | null>(null);
  const [propertiesHint, setPropertiesHint] = useState(false);
  const propertiesHintTimerRef = useRef<number | null>(null);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);

  const readOnly = locked;

  useEffect(() => {
    return () => {
      if (propertiesHintTimerRef.current) window.clearTimeout(propertiesHintTimerRef.current);
    };
  }, []);

  useAutosave(
    loaded && status === "authenticated" && !isGuestDraft && !readOnly ? templateId : null,
  );
  const { saveError: guestAutosaveError } = useGuestDraftAutosave(
    loaded && isGuestDraft && !readOnly ? templateId : null,
  );
  useEditorShortcuts();

  // Tracks the templateId that has already been fully loaded into the store.
  // NextAuth's SessionProvider re-syncs `status` across tabs (storage events,
  // refetch on focus), which would otherwise re-run this effect mid-edit and
  // reload a guest draft from localStorage, clobbering unsaved keystrokes.
  // Once a templateId has loaded once, further status toggles are ignored.
  const loadedTemplateIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (loadedTemplateIdRef.current === templateId) return;
    let cancelled = false;
    setLoaded(false);

    async function loadEditor() {
      const localDraft = getGuestDraft(templateId);
      if (status === "unauthenticated" || localDraft) {
        const draft = localDraft ?? {
          id: templateId,
          name: "Untitled template",
          root: createRootBlock(),
          updatedAt: Date.now(),
        };
        if (!localDraft) saveGuestDraft(draft);
        if (cancelled) return;
        loadTemplate(draft.id, draft.name, normalizeRoot(draft.root));
        setIsGuestDraft(true);
        setLocked(false);
        setCanUpload(false);
        setLoaded(true);
        loadedTemplateIdRef.current = templateId;
        return;
      }

      setIsGuestDraft(false);
      try {
        const [templateRes, usageRes] = await Promise.all([
          fetch(`/api/templates/${templateId}`),
          fetch("/api/billing/usage"),
        ]);
        const templateData = await parseJsonResponse<{
          id: string;
          name: string;
          content: StackBlock;
          locked?: boolean;
        }>(templateRes);
        const usageData = await parseJsonResponse<{
          limits: { maxImagesPerTemplate: number };
        }>(usageRes);

        if (cancelled) return;
        if (templateData?.id) {
          loadTemplate(templateData.id, templateData.name, normalizeRoot(templateData.content));
          setLocked(!!templateData.locked);
        }
        if (usageData?.limits) {
          setCanUpload(usageData.limits.maxImagesPerTemplate > 0);
        }
        loadedTemplateIdRef.current = templateId;
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadEditor();
    return () => {
      cancelled = true;
    };
  }, [loadTemplate, status, templateId]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      if (isGuestDraft) {
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, root }),
        });
        const data = await parseJsonResponse<{ id: string; error?: string }>(response);
        if (!response.ok || !data?.id) {
          setSaveError(data?.error ?? "Could not save this template.");
          return;
        }
        deleteGuestDraft(templateId);
        markSaved();
        setIsGuestDraft(false);
        setLoaded(false);
        router.replace(`/editor/${data.id}`);
        return;
      }

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, root }),
      });
      const data = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        setSaveError(data?.error ?? "Could not save this template.");
        return;
      }
      markSaved();
    } catch {
      setSaveError("Could not save this template. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      focusNewBlockProperties();
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

  function openPreview() {
    setHasPreviewed(true);
    setPreviewOpen(true);
  }

  function focusNewBlockProperties() {
    setPropertiesHint(true);
    if (propertiesHintTimerRef.current) window.clearTimeout(propertiesHintTimerRef.current);
    propertiesHintTimerRef.current = window.setTimeout(() => setPropertiesHint(false), 1600);
    if (window.innerWidth < 1280) setMobilePanel("properties");
  }

  if (!loaded) {
    return <LoadingOverlay label="Loading template..." />;
  }

  const editorBody = (
    <div className="flex h-dvh min-w-0 flex-col bg-background">
      {readOnly && (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          This template is locked on your current plan. You can preview and export only.
        </div>
      )}
      <Toolbar
        readOnly={readOnly}
        templateId={templateId}
        isGuestDraft={isGuestDraft}
        saving={saving}
        onSave={handleSave}
        onPreview={openPreview}
        onTestSent={() => setHasSentTest(true)}
      />
      {(saveError ?? guestAutosaveError) && (
        <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {saveError ?? guestAutosaveError}
        </div>
      )}
      {!readOnly && (
        <EditorChecklist
          hasContent={root.children.length > 0}
          hasPreviewed={hasPreviewed}
          hasSentTest={hasSentTest}
          isSaved={!dirty}
        />
      )}
      {!readOnly && (
        <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-b bg-background px-3 xl:hidden">
          <Button data-tour="add-content" type="button" variant="outline" size="sm" className="h-8 flex-1 gap-2 lg:hidden" onClick={() => setMobilePanel("build")}>
            <Blocks className="h-4 w-4" /> Add content
          </Button>
          <Button data-tour="properties" type="button" variant="outline" size="sm" className="h-8 flex-1 gap-2 lg:max-w-56" disabled={!selectedBlock} onClick={() => setMobilePanel("properties")}>
            <SlidersHorizontal className="h-4 w-4" /> Edit selection
          </Button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {!readOnly && (
          <aside className="hidden w-72 shrink-0 flex-col overflow-hidden border-r bg-background shadow-[1px_0_0_hsl(var(--border))] lg:flex">
            <LeftPanel onBlockAdded={focusNewBlockProperties} />
          </aside>
        )}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/50">
          <div className="relative flex-1 overflow-hidden">
            <Canvas root={root} zoom={zoom} tool={tool} onInitialFit={setZoom} />
            <ZoomToolbar tool={tool} onToolChange={setTool} zoom={zoom} onZoomChange={setZoom} />
          </div>
        </main>
        {!readOnly ? (
          <aside className={cn("hidden w-80 shrink-0 overflow-y-auto border-l bg-background shadow-[-1px_0_0_hsl(var(--border))] transition-shadow xl:block", propertiesHint && "ring-2 ring-inset ring-primary/40 shadow-[-8px_0_24px_-12px_hsl(var(--primary))]")}>
            <PropertiesPanel
              block={selectedBlock}
              templateId={templateId}
              canUpload={canUpload}
            />
          </aside>
        ) : (
          <aside className="flex w-80 items-center justify-center border-l bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Properties are disabled while this template is locked.
          </aside>
        )}
      </div>

      {!readOnly && mobilePanel && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button type="button" aria-label="Close panel" className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" onClick={() => setMobilePanel(null)} />
          <aside className={cn("absolute inset-y-0 flex w-[min(88vw,22rem)] flex-col overflow-hidden bg-background shadow-2xl", mobilePanel === "build" ? "left-0" : "right-0")}>
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
              <span className="text-sm font-semibold">{mobilePanel === "build" ? "Add content" : "Edit selection"}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobilePanel(null)} aria-label="Close panel">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mobilePanel === "build" ? (
                <LeftPanel onBlockAdded={focusNewBlockProperties} />
              ) : (
                <PropertiesPanel block={selectedBlock} templateId={templateId} canUpload={canUpload} />
              )}
            </div>
          </aside>
        </div>
      )}
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
      {!readOnly && <EditorOnboarding />}
    </>
  );
}
