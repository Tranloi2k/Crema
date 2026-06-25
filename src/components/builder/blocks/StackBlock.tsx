"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { FlexAlign, FlexJustify, StackBlock as StackBlockType, Block } from "@/lib/types";
import { toDimension, dim, dimToCss, toSides, sidesToCss } from "@/lib/types";
import { flexAlignToCss, flexJustifyToCss, isDistributedJustify } from "@/lib/layout/flexAlign";
import {
  blockUsesFlexHeight,
  childFillsStackCrossAxis,
  childFillsStackMainAxis,
  getBlockHeightDim,
  hasDefiniteHeight,
  isFillHeight,
  stackNeedsColumnHeightLayout,
  stackNeedsRowHeightLayout,
  stackNeedsRowWidthLayout,
  stackHasFitHeight,
} from "@/lib/layout/dimensions";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import { SortableBlockItem } from "@/components/builder/SortableBlockItem";
import { cn } from "@/lib/utils";

// The droppable+flex+SortableContext+children-list portion of a Stack,
// without the outer padding/commonStyle wrapper — shared by nested Stacks
// (via StackBlock below) and the canvas's root Stack (via Canvas.tsx), so
// both render their children identically.
export function StackChildren({ block }: { block: StackBlockType }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stack-drop-${block.id}`,
    data: { containerId: block.id },
  });

  const isRow = block.style.direction === "row";
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const stackHeight = toDimension(block.style.height, dim(0, "fit-content"));
  const isFillWidth = width.unit === "fill";
  const columnHeightLayout = stackNeedsColumnHeightLayout(block, isRow);
  const rowHeightLayout = stackNeedsRowHeightLayout(block, isRow);
  const rowWidthLayout = stackNeedsRowWidthLayout(block, isRow);
  const fitHeight = stackHasFitHeight(block);
  const isEmpty = block.children.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        flexDirection: isRow ? "row" : "column",
        gap: block.style.gap,
        justifyContent: flexJustifyToCss(block.style.justify),
        alignItems: flexAlignToCss(block.style.align),
        width: isFillWidth || rowWidthLayout ? (width.unit === "fit-content" ? "100%" : dimToCss(width)) : undefined,
        maxWidth: isFillWidth || rowWidthLayout ? "100%" : undefined,
        ...(fitHeight ? { height: "auto", alignSelf: "flex-start" } : {}),
        ...(columnHeightLayout
          ? {
              flex: isFillHeight(stackHeight) ? "1 1 0%" : 1,
              minHeight: 0,
              height: hasDefiniteHeight(stackHeight) && !isFillHeight(stackHeight) ? dimToCss(stackHeight) : "100%",
            }
          : {}),
        ...(rowHeightLayout
          ? {
              height:
                hasDefiniteHeight(stackHeight) && !isFillHeight(stackHeight)
                  ? dimToCss(stackHeight)
                  : "100%",
              minHeight: hasDefiniteHeight(stackHeight) ? dimToCss(stackHeight) : 0,
              alignSelf: "stretch",
            }
          : {}),
      }}
      className={cn(
        "w-full rounded border border-dashed border-muted-foreground/30",
        isEmpty && "min-h-[48px]",
        !fitHeight && "self-stretch",
        (columnHeightLayout || rowHeightLayout) && "flex-1",
        rowWidthLayout && "w-full",
        isOver && "border-primary ring-2 ring-primary/40"
      )}
    >
      <SortableContext
        items={block.children.map((c) => c.id)}
        strategy={isRow ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        {block.children.length === 0 ? (
          <div className="flex min-h-[48px] w-full flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
            Drop blocks here
          </div>
        ) : (
          block.children.map((child, index) => (
            <StackChildWrapper
              key={child.id}
              child={child}
              isRow={isRow}
              stackAlign={block.style.align ?? "start"}
              stackJustify={block.style.justify ?? "start"}
            >
              <SortableBlockItem
                block={child}
                containerId={block.id}
                index={index}
                stretchWidth={childFillsStackCrossAxis(child, isRow)}
                compactWidth={isRow && isDistributedJustify(block.style.justify)}
              />
            </StackChildWrapper>
          ))
        )}
      </SortableContext>
    </div>
  );
}

export function StackBlock({ block }: { block: StackBlockType }) {
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const height = toDimension(block.style.height, dim(0, "fit-content"));
  const isRow = block.style.direction === "row";
  const isFillWidth = width.unit === "fill";
  const isFillH = isFillHeight(height);
  const hasHeight = hasDefiniteHeight(height);
  const rowHeightLayout = stackNeedsRowHeightLayout(block, isRow);
  const fitHeight = stackHasFitHeight(block);
  const needsFrame = hasHeight || rowHeightLayout || isFillH;

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        width: dimToCss(width),
        ...(fitHeight ? { height: "auto", alignSelf: "flex-start" } : {}),
        ...(needsFrame
          ? {
              ...(isFillH
                ? { flex: "1 1 0%", alignSelf: "stretch" }
                : hasHeight || rowHeightLayout
                  ? { height: dimToCss(height) }
                  : {}),
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }
          : {}),
        maxWidth: isFillWidth ? "100%" : undefined,
        alignSelf: isFillWidth || isFillH ? "stretch" : undefined,
        ...commonStyleToReactStyle(block.style),
      }}
      className={cn((isFillWidth || isFillH) && "w-full", needsFrame && "min-h-0")}
    >
      <StackChildren block={block} />
    </div>
  );
}

function StackChildWrapper({
  child,
  isRow,
  stackAlign,
  stackJustify,
  children,
}: {
  child: Block;
  isRow: boolean;
  stackAlign: FlexAlign;
  stackJustify: FlexJustify;
  children: React.ReactNode;
}) {
  const childHeight = getBlockHeightDim(child);
  const flexHeight = blockUsesFlexHeight(child);
  const fillCross = childFillsStackCrossAxis(child, isRow);
  const fillMain = childFillsStackMainAxis(child, isRow, stackJustify);
  const alignSelf = flexAlignToCss(stackAlign);

  if (isRow) {
    return (
      <div
        className={cn(
          fillMain ? "min-w-0 flex-1" : "shrink-0",
          flexHeight && "flex min-h-0 flex-col",
          flexHeight && !fillCross && "h-auto"
        )}
        style={{
          alignSelf: fillCross ? "stretch" : alignSelf,
          width: fillMain ? undefined : "auto",
          height: fillCross ? "100%" : "auto",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(fillCross ? "w-full" : "max-w-full", flexHeight && "flex min-h-0 flex-col", fillMain && "flex-1")}
      style={{
        alignSelf: fillCross ? "stretch" : alignSelf,
        width: fillCross ? "100%" : "auto",
        ...(flexHeight && !isFillHeight(childHeight) ? { height: "100%" } : {}),
      }}
    >
      {children}
    </div>
  );
}
