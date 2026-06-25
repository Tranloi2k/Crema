import type { Block, CommonStyle, FlexAlign, FlexJustify, StackBlock } from "@/lib/types";
import { toDimension, dim, dimToCss, toSides, sidesToCss } from "@/lib/types";
import { isDistributedJustify } from "@/lib/layout/flexAlign";
import { commonStyleToCssString, commonContainerTableCss } from "@/lib/export/commonStyle";
import { imageToHtmlAttrs } from "@/lib/export/imageStyle";
import {
  textSizeToCss,
  textTypographyToCss,
  textVerticalAlignToCss,
  hasExportFixedTextHeight,
  normalizeTextTypography,
} from "@/lib/export/textStyle";

function pad(style: { padding: number | import("@/lib/types").Sides | undefined }): string {
  return sidesToCss(toSides(style.padding));
}

const DEFAULT_CANVAS_WIDTH = 600;

type BlocksToHtmlOptions = {
  width?: number;
  /** Gray inbox padding around the email — only for standalone browser preview, not editor parity */
  inboxChrome?: boolean;
};

type RenderContext = {
  inRowStack?: boolean;
  rowJustify?: FlexJustify;
  rowChildIndex?: number;
  rowChildCount?: number;
  parentHasHeight?: boolean;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function commonSuffix(style: Partial<CommonStyle>, clipRadius = true): string {
  const css = commonStyleToCssString(style, { clipRadius });
  return css ? `${css};` : "";
}

function flexAlignToValign(a: FlexAlign | undefined): "top" | "middle" | "bottom" {
  if (a === "center") return "middle";
  if (a === "end") return "bottom";
  return "top";
}

function flexAlignToHAlign(a: FlexAlign | undefined): "left" | "center" | "right" {
  if (a === "center") return "center";
  if (a === "end") return "right";
  return "left";
}

function flexJustifyToValign(a: FlexJustify | undefined): "top" | "middle" | "bottom" {
  if (a === "center") return "middle";
  if (a === "end") return "bottom";
  return "top";
}

function flexJustifyToHAlign(a: FlexJustify | undefined): "left" | "center" | "right" {
  if (a === "center") return "center";
  if (a === "end") return "right";
  return "left";
}

const ROW_FLEX_SPACER = `<td width="100%" style="width:100%;font-size:0;line-height:0;">&nbsp;</td>`;
const ROW_EVENLY_SPACER = `<td width="1%" style="width:1%;font-size:0;line-height:0;">&nbsp;</td>`;
const COL_FLEX_SPACER = `<tr><td height="100%" style="height:100%;font-size:0;line-height:0;">&nbsp;</td></tr>`;

function joinWithFlexSpacers(
  items: string[],
  justify: FlexJustify,
  spacer: string,
  evenlySpacer?: string
): string {
  if (items.length <= 1) return items.join("");
  if (justify === "between") {
    const out = [items[0]];
    for (let i = 1; i < items.length; i++) {
      out.push(spacer, items[i]);
    }
    return out.join("");
  }
  if (justify === "evenly") {
    const spring = evenlySpacer ?? spacer;
    return spring + items.join(spring) + spring;
  }
  return items.join("");
}

function buildStackRows(block: StackBlock, parentHasHeight = false): string {
  const gapCell = `<td style="width:${block.style.gap}px;font-size:0;line-height:0;">&nbsp;</td>`;
  const gapRow = `<tr><td style="height:${block.style.gap}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const isRow = block.style.direction === "row";
  const justify = block.style.justify ?? "start";
  const valign = flexAlignToValign(block.style.align);
  const halign = flexAlignToHAlign(block.style.align);
  const cellWrap = (cellHtml: string, childIndex?: number, childCount?: number) => {
    if (isRow) {
      let attrs = `valign="${valign}"`;
      if (
        isDistributedJustify(justify) &&
        childIndex !== undefined &&
        childCount !== undefined &&
        justify === "between"
      ) {
        if (childIndex === 0) attrs += ` align="left"`;
        else if (childIndex === childCount - 1) attrs += ` align="right"`;
        else attrs += ` align="center"`;
      }
      return cellHtml.replace("<td ", `<td ${attrs} `);
    }
    return cellHtml.replace("<td ", `<td align="${halign}" `);
  };

  if (isRow) {
    const childCount = block.children.length;
    const stackH = toDimension(block.style.height, dim(0, "fit-content"));
    const stackHasHeight = stackH.unit === "px" || stackH.unit === "%";
    const rawCells = block.children.map((c, i) =>
      cellWrap(
        renderBlockCell(c, {
          inRowStack: true,
          rowJustify: justify,
          rowChildIndex: i,
          rowChildCount: childCount,
          parentHasHeight: stackHasHeight || parentHasHeight,
        }),
        i,
        childCount
      )
    );
    const rowStyle = stackHasHeight
      ? `height:${stackH.unit === "px" ? `${stackH.value}px` : dimToCss(stackH)};`
      : "";

    // Row stacks in email always span the parent cell width.
    if (isDistributedJustify(justify)) {
      const cells = joinWithFlexSpacers(rawCells, justify, ROW_FLEX_SPACER, ROW_EVENLY_SPACER);
      const innerHeight = stackHasHeight ? "height:100%;" : "";
      return `<tr><td style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${innerHeight}border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }

    const cells = rawCells.join(gapCell);
    if (justify !== "start") {
      const distribute = flexJustifyToHAlign(justify);
      return `<tr><td align="${distribute}" style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }
    if (stackHasHeight) {
      return `<tr style="${rowStyle}"><td valign="${valign}" style="${rowStyle}width:100%;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }
    return `<tr><td style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
  }

  const stackH = toDimension(block.style.height, dim(0, "fit-content"));
  const stackHasHeight = stackH.unit === "px" || stackH.unit === "%";
  const rawChildRows = block.children.map((c) =>
    `<tr>${cellWrap(renderBlockCell(c, { parentHasHeight: stackHasHeight || parentHasHeight }))}</tr>`
  );

  if (isDistributedJustify(justify) && stackHasHeight) {
    const childRows = joinWithFlexSpacers(rawChildRows, justify, COL_FLEX_SPACER);
    const heightStyle =
      stackH.unit === "px" ? `height:${stackH.value}px;` : `height:${dimToCss(stackH)};`;
    return `<tr><td style="${heightStyle}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;height:100%;width:100%;">
        ${childRows}
      </table>
    </td></tr>`;
  }

  const childRows = rawChildRows.join(gapRow);

  if (justify !== "start" && stackHasHeight) {
    const distribute = flexJustifyToValign(justify);
    const heightStyle =
      stackH.unit === "px" ? `height:${stackH.value}px;` : `height:${dimToCss(stackH)};`;
    return `<tr><td valign="${distribute}" style="${heightStyle}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
        ${childRows}
      </table>
    </td></tr>`;
  }

  return childRows;
}

function renderBlockCell(block: Block, ctx: RenderContext = {}): string {
  switch (block.type) {
    case "text": {
      const sizeCss = textSizeToCss(block.style, ctx);
      const sizeSuffix = sizeCss ? `${sizeCss};` : "";
      const typography = textTypographyToCss(block.style);
      const valign = normalizeTextTypography(block.style).verticalAlign;
      const edgeCell =
        ctx.inRowStack && ctx.rowJustify && isDistributedJustify(ctx.rowJustify)
          ? "width:1%;"
          : "";
      const nowrap =
        ctx.inRowStack && ctx.rowJustify && isDistributedJustify(ctx.rowJustify)
          ? "white-space:nowrap;"
          : "";
      const fixedHeight = hasExportFixedTextHeight(block.style, ctx);

      if (fixedHeight) {
        return `<td style="padding:${pad(block.style)};${edgeCell}${sizeSuffix}${nowrap}${textVerticalAlignToCss(block.style)}${commonSuffix(block.style, false)}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td style="${typography};${nowrap}vertical-align:${valign};">
              ${block.content.html}
            </td>
          </tr>
        </table>
      </td>`;
      }

      return `<td style="padding:${pad(block.style)};${edgeCell}${typography};${sizeSuffix}${nowrap}${commonSuffix(block.style, false)}">${block.content.html}</td>`;
    }
    case "image": {
      const width = toDimension(block.style.width, dim(560));
      const height = toDimension(block.style.height, dim(0, "fit-content"));
      const { widthAttr, heightAttr, style: imgStyle } = imageToHtmlAttrs(width, height);
      const img = `<img src="${escapeHtml(block.content.src)}" alt="${escapeHtml(
        block.content.alt
      )}"${widthAttr}${heightAttr} style="${imgStyle}" />`;
      const inner = block.content.href
        ? `<a href="${escapeHtml(block.content.href)}" target="_blank">${img}</a>`
        : img;
      return `<td style="padding:${pad(block.style)};text-align:${block.style.align};${commonSuffix(block.style)}">${inner}</td>`;
    }
    case "button":
      return `<td style="padding:${pad(block.style)};text-align:${block.style.align};${commonSuffix(block.style)}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${
          block.style.align === "center" ? "0 auto" : "0"
        };">
          <tr>
            <td bgcolor="${block.style.bgColor}" style="border-radius:${block.style.borderRadius}px;">
              <a href="${escapeHtml(block.content.href)}" target="_blank" style="display:inline-block;padding:10px 20px;color:${block.style.textColor};font-family:Arial,Helvetica,sans-serif;font-size:14px;text-decoration:none;border-radius:${block.style.borderRadius}px;">${escapeHtml(block.content.label)}</a>
            </td>
          </tr>
        </table>
      </td>`;
    case "divider":
      return `<td style="padding:${pad(block.style)};${commonSuffix(block.style)}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-top:${block.style.thickness}px solid ${block.style.color};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>`;
    case "spacer": {
      const height = toDimension(block.style.height, dim(24));
      return `<td style="height:${dimToCss(height)};line-height:${dimToCss(height)};font-size:0;${commonSuffix(block.style)}">&nbsp;</td>`;
    }
    case "stack": {
      const stackW = toDimension(block.style.width, dim(0, "fit-content"));
      const isRow = block.style.direction === "row";
      const stackPad = pad(block.style);
      const widthDecl =
        isRow || stackW.unit === "fill" || stackW.unit === "px" || stackW.unit === "%"
          ? `width:100%;`
          : stackW.unit === "fit-content"
            ? "width:100%;"
            : `width:${dimToCss(stackW)};`;
      const containerCss = commonContainerTableCss(block.style);
      const stackH = toDimension(block.style.height, dim(0, "fit-content"));
      const stackHasHeight = stackH.unit === "px" || stackH.unit === "%";
      return `<td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${widthDecl}${containerCss};">
          <tr>
            <td style="padding:${stackPad};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                ${buildStackRows(block, stackHasHeight)}
              </table>
            </td>
          </tr>
        </table>
      </td>`;
    }
  }
}

function renderEmailTable(root: StackBlock, canvasWidth: number): string {
  const rootPad = pad(root.style);
  const containerCss = commonContainerTableCss(root.style);

  return `<table id="crema-email" role="presentation" width="${canvasWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${canvasWidth}px;max-width:100%;box-sizing:border-box;background-color:#ffffff;${containerCss};">
        <tr>
          <td id="crema-email-content" style="padding:${rootPad};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
              ${buildStackRows(root)}
            </table>
          </td>
        </tr>
      </table>`;
}

export function blocksToHtml(root: StackBlock, options?: BlocksToHtmlOptions): string {
  const canvasWidth = options?.width ?? DEFAULT_CANVAS_WIDTH;
  const inboxChrome = options?.inboxChrome ?? false;
  const emailTable = renderEmailTable(root, canvasWidth);

  const bodyInner = inboxChrome
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      ${emailTable}
    </td>
  </tr>
</table>`
    : emailTable;

  const bodyBg = inboxChrome ? "#f4f4f5" : "#ffffff";

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Email</title>
<style>
  html, body { margin: 0; padding: 0; height: auto; line-height: 0; }
  table { border-collapse: collapse; }
  p { margin: 0; }
  img { border: 0; display: block; max-width: 100%; }
  #crema-email { box-sizing: border-box; line-height: normal; vertical-align: top; }
</style>
</head>
<body style="margin:0;padding:0;line-height:0;background-color:${bodyBg};">
${bodyInner}
</body>
</html>`;
}
