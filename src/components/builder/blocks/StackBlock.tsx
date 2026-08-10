"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { FlexAlign, FlexJustify, StackBlock as StackBlockType, Block } from "@/lib/types";
import { toDimension, dim, dimToCss, toSides, sidesToCss } from "@/lib/types";
import { flexAlignToCss, flexJustifyToCss, isDistributedJustify } from "@/lib/layout/flexAlign";
import {
  blockUsesFlexHeight,
  blockShrinksToContentWidth,
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
export function StackChildren({ block, isRoot = false }: { block: StackBlockType; isRoot?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stack-drop-${block.id}`,
    data: { containerId: block.id },
  });
  const { active } = useDndContext();
  const isAddingBlock = active?.data.current?.source === "palette";

  const isRow = block.style.direction === "row";
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const stackHeight = toDimension(block.style.height, dim(0, "fit-content"));
  const isFillWidth = width.unit === "fill";
  const columnHeightLayout = stackNeedsColumnHeightLayout(block, isRow);
  const rowHeightLayout = stackNeedsRowHeightLayout(block, isRow);
  const rowWidthLayout = stackNeedsRowWidthLayout(block, isRow);
  const rowCrossFill = isRow && block.children.some((c) => childFillsStackCrossAxis(c, true));
  const fitHeight = stackHasFitHeight(block) && !rowCrossFill;
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
        maxWidth: "100%",
        minWidth: 0,
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
        "relative w-full min-w-0 rounded-lg border border-dashed border-muted-foreground/30 transition-[border-color,background-color,box-shadow] duration-150",
        isEmpty && (isRoot ? "min-h-[280px]" : "min-h-[72px]"),
        !fitHeight && "self-stretch",
        (columnHeightLayout || rowHeightLayout) && "flex-1",
        rowWidthLayout && "w-full",
        isAddingBlock && !isOver && "border-primary/45 bg-primary/[0.025]",
        isOver && "border-primary bg-primary/[0.06] ring-2 ring-primary/35 ring-offset-2"
      )}
    >
      <SortableContext
        items={block.children.map((c) => c.id)}
        strategy={isRow ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        {block.children.length === 0 ? (
          <div className={cn("flex w-full flex-1 flex-col items-center justify-center p-4 text-center", isRoot ? "min-h-[280px]" : "min-h-[72px]")}>
            <span className={cn("text-sm font-semibold", isOver ? "text-primary" : "text-foreground")}>
              {isOver ? "Release to add it here" : isRoot ? "Start building your email" : "Add content to this layout"}
            </span>
            <span className="mt-1 max-w-64 text-xs leading-5 text-muted-foreground">
              {isAddingBlock ? "Move over this area and release." : isRoot ? "Choose a ready-made section or drag a block from the left panel." : "Drag a block here or select one from the Blocks panel."}
            </span>
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
                stretchWidth={
                  isRow
                    ? childFillsStackMainAxis(child, true, block.style.justify)
                    : childFillsStackCrossAxis(child, false)
                }
                stretchHeight={isRow && childFillsStackCrossAxis(child, true)}
                compactWidth={
                  isRow &&
                  (isDistributedJustify(block.style.justify) || blockShrinksToContentWidth(child))
                }
              />
            </StackChildWrapper>
          ))
        )}
      </SortableContext>
      {isOver && !isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-lg border-2 border-primary bg-primary/5">
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
            Release to add here
          </span>
        </div>
      )}
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
        maxWidth: "100%",
        minWidth: 0,
        alignSelf: isFillWidth || isFillH ? "stretch" : undefined,
        ...commonStyleToReactStyle(block.style),
      }}
      className={cn((isFillWidth || isFillH) && "w-full min-w-0", needsFrame && "min-h-0")}
      data-resize-target={block.id}
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
          fillCross && "self-stretch"
        )}
        style={{
          alignSelf: fillCross ? "stretch" : alignSelf,
          width: fillMain ? undefined : "auto",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        fillCross ? "w-full min-w-0" : "max-w-full min-w-0",
        flexHeight && "flex min-h-0 flex-col",
        fillMain && "min-h-0 flex-1"
      )}
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
