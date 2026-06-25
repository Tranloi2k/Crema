"use client";

import { MousePointer2, Hand, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Tool = "select" | "pan";

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;

export function ZoomToolbar({
  tool,
  onToolChange,
  zoom,
  onZoomChange,
}: {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/95 px-2 py-1.5 shadow-md backdrop-blur">
      <Button
        size="icon"
        variant={tool === "select" ? "default" : "ghost"}
        className="h-8 w-8 rounded-full"
        onClick={() => onToolChange("select")}
        title="Select"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={tool === "pan" ? "default" : "ghost"}
        className="h-8 w-8 rounded-full"
        onClick={() => onToolChange("pan")}
        title="Pan"
      >
        <Hand className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full"
        onClick={() => onZoomChange(Math.max(ZOOM_MIN, Math.round((zoom - ZOOM_STEP) * 100) / 100))}
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <button
        className={cn(
          "w-12 rounded-full px-1 text-center text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        onClick={() => onZoomChange(1)}
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full"
        onClick={() => onZoomChange(Math.min(ZOOM_MAX, Math.round((zoom + ZOOM_STEP) * 100) / 100))}
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
