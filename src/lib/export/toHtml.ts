import type { Block, CommonStyle, FlexAlign, FlexJustify, StackBlock } from "@/lib/types";
import { toDimension, dim, dimToCss, toSides, sidesToCss } from "@/lib/types";
import { getSocialItems, socialIconUrl, SOCIAL_PLATFORMS } from "@/lib/social";
import { isDistributedJustify } from "@/lib/layout/flexAlign";
import { childFillsStackCrossAxis, childFillsStackMainAxis, isFillHeight, rowShouldStackOnMobile, stackHasFillMainChild } from "@/lib/layout/dimensions";
import { commonStyleToCssString, commonContainerTableCss } from "@/lib/export/commonStyle";
import { imageToHtmlAttrs, imageRowCellWidthAttr, imageRowCellWidthCss } from "@/lib/export/imageStyle";
import {
  buttonAlignAttr,
  buttonCellHeightAttr,
  buttonCellHeightStyle,
  buttonCellWidthStyle,
  buttonLinkDisplayStyle,
  buttonLinkHeightStyle,
  buttonLinkPaddingStyle,
  buttonTableAlignAttr,
  buttonTablePresentationStyle,
  buttonTableWidthAttr,
  isButtonCollapsed,
} from "@/lib/export/buttonStyle";
import {
  textSizeToCss,
  textTypographyToCss,
  textVerticalAlignToCss,
  hasExportFixedTextHeight,
  normalizeTextTypography,
  textExportInnerTableCss,
  textExportInnerTableAttrs,
  textExportInnerCellCss,
  stackCrossAlignToVerticalCss,
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
  stackAlign?: FlexAlign;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function commonSuffix(style: Partial<CommonStyle>, clipRadius = true, skipBackground = false): string {
  const css = commonStyleToCssString(style, { clipRadius, skipBackground });
  return css ? `${css};` : "";
}

/** Stretch a table cell so fill-height children match canvas flex growth. */
function withFillHeight(cellHtml: string, expand: boolean): string {
  if (!expand) return cellHtml;
  return cellHtml.replace(
    "<td ",
    '<td valign="top" height="100%" style="height:100%;vertical-align:top;" '
  );
}

function stackHeightCss(stackH: ReturnType<typeof toDimension>): string {
  return stackH.unit === "px" ? `height:${stackH.value}px;` : `height:${dimToCss(stackH)};`;
}

/** Match canvas flex: only stretch inner table rows when a child actually grows (fill) or justify distributes space. */
function stackContentTableFullHeight(stack: StackBlock, sizedParent: boolean): boolean {
  const stackH = toDimension(stack.style.height, dim(0, "fit-content"));
  const stackSized =
    stackH.unit === "px" || stackH.unit === "%" || (isFillHeight(stackH) && sizedParent);
  if (!stackSized) return false;
  const justify = stack.style.justify ?? "start";
  if (isDistributedJustify(justify)) return true;
  return stackHasFillMainChild(stack);
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

const ROW_FLEX_SPACER = `<td class="crema-gap" width="100%" style="width:100%;font-size:0;line-height:0;">&nbsp;</td>`;
const ROW_EVENLY_SPACER = `<td class="crema-gap" width="1%" style="width:1%;font-size:0;line-height:0;">&nbsp;</td>`;
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
  const gapCell = `<td class="crema-gap" style="width:${block.style.gap}px;font-size:0;line-height:0;">&nbsp;</td>`;
  const gapRow = `<tr><td style="height:${block.style.gap}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const isRow = block.style.direction === "row";
  const justify = block.style.justify ?? "start";
  const valign = flexAlignToValign(block.style.align);
  const halign = flexAlignToHAlign(block.style.align);
  const cellWrap = (cellHtml: string, childIndex?: number, childCount?: number) => {
    if (isRow) {
      // crema-col lets the media query stack horizontal columns on mobile.
      let attrs = `class="crema-col" valign="${valign}"`;
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
    const stackHasHeight =
      stackH.unit === "px" || stackH.unit === "%" || (isFillHeight(stackH) && parentHasHeight);
    const rowCrossFill = block.children.some((c) => childFillsStackCrossAxis(c, true));
    const innerRowHeight = stackHasHeight || rowCrossFill ? "height:100%;" : "";
    const rawCells = block.children.map((c, i) =>
      cellWrap(
        renderBlockCell(c, {
          inRowStack: true,
          stackAlign: block.style.align,
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
    const mobileStackClass = rowShouldStackOnMobile(block) ? ' class="crema-stack-mobile"' : "";

    // Row stacks in email always span the parent cell width.
    if (isDistributedJustify(justify)) {
      const cells = joinWithFlexSpacers(rawCells, justify, ROW_FLEX_SPACER, ROW_EVENLY_SPACER);
      return `<tr><td style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${mobileStackClass} style="width:100%;${innerRowHeight}border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }

    const cells = rawCells.join(gapCell);
    if (justify !== "start") {
      const distribute = flexJustifyToHAlign(justify);
      return `<tr><td align="${distribute}" style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${mobileStackClass} style="width:100%;${innerRowHeight}border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }
    if (stackHasHeight) {
      return `<tr style="${rowStyle}"><td valign="${valign}" style="${rowStyle}width:100%;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${mobileStackClass} style="width:100%;${innerRowHeight}border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
    }
    return `<tr><td style="width:100%;${rowStyle}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${mobileStackClass} style="width:100%;${innerRowHeight}border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`;
  }

  const stackH = toDimension(block.style.height, dim(0, "fit-content"));
  const stackHasHeight = stackH.unit === "px" || stackH.unit === "%";
  const parentSized = stackHasHeight || parentHasHeight;
  const rawChildRows = block.children.map((c) => {
    const childCtx = { parentHasHeight: parentSized };
    const fillMain = childFillsStackMainAxis(c, false, justify);
    const cell = withFillHeight(
      cellWrap(renderBlockCell(c, childCtx)),
      fillMain && parentSized
    );
    return `<tr>${cell}</tr>`;
  });

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

  if (stackHasHeight && justify === "start") {
    const innerHeight = stackContentTableFullHeight(block, parentHasHeight) ? "height:100%;" : "";
    return `<tr><td valign="top" style="${stackHeightCss(stackH)}vertical-align:top;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;${innerHeight}">
        ${childRows}
      </table>
    </td></tr>`;
  }

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
      // In row stacks: fixed-height frames use inner verticalAlign; fit-content uses stack cross-axis align.
      const outerValignCss = ctx.inRowStack
        ? fixedHeight
          ? ""
          : stackCrossAlignToVerticalCss(ctx.stackAlign)
        : textVerticalAlignToCss(block.style);
      const outerHeightAttr = fixedHeight && ctx.inRowStack ? ' height="100%"' : "";

      if (fixedHeight) {
        const innerTableCss = textExportInnerTableCss(true);
        const innerTableAttrs = textExportInnerTableAttrs(true);
        const innerCellCss = textExportInnerCellCss(typography, valign, nowrap, true);
        return `<td${outerHeightAttr} style="padding:${pad(block.style)};${edgeCell}${sizeSuffix}${nowrap}${outerValignCss}${commonSuffix(block.style, false)}">
        <table role="presentation"${innerTableAttrs} cellpadding="0" cellspacing="0" border="0" style="${innerTableCss}">
          <tr>
            <td style="${innerCellCss}">
              ${block.content.html}
            </td>
          </tr>
        </table>
      </td>`;
      }

      return `<td style="padding:${pad(block.style)};${edgeCell}${typography};${sizeSuffix}${nowrap}${outerValignCss}${commonSuffix(block.style, false)}">${block.content.html}</td>`;
    }
    case "image": {
      const width = toDimension(block.style.width, dim(560));
      const height = toDimension(block.style.height, dim(0, "fit-content"));
      const { widthAttr, heightAttr, style: imgStyle } = imageToHtmlAttrs(width, height);
      const rowCellWidth = imageRowCellWidthCss(width, !!ctx.inRowStack);
      const rowCellWidthAttr = imageRowCellWidthAttr(width, !!ctx.inRowStack);
      const img = `<img src="${escapeHtml(block.content.src)}" alt="${escapeHtml(
        block.content.alt
      )}"${widthAttr}${heightAttr} style="${imgStyle}" />`;
      const inner = block.content.href
        ? `<a href="${escapeHtml(block.content.href)}" target="_blank">${img}</a>`
        : img;
      return `<td${rowCellWidthAttr} style="padding:${pad(block.style)};${rowCellWidth}text-align:${block.style.align};${commonSuffix(block.style)}">${inner}</td>`;
    }
    case "button": {
      const width = toDimension(block.style.width, dim(0, "fit-content"));
      const height = toDimension(block.style.height, dim(0, "fit-content"));

      if (isButtonCollapsed(width, height)) {
        return `<td style="padding:${pad(block.style)};font-size:0;line-height:0;${commonSuffix(block.style, true, true)}">&nbsp;</td>`;
      }

      const tableWidth = buttonTableWidthAttr(width);
      const tableAlign = buttonTableAlignAttr(block.style.align, width);
      const tableStyle = buttonTablePresentationStyle(block.style.align, width);
      const cellWidth = buttonCellWidthStyle(width);
      const cellHeightAttr = buttonCellHeightAttr(height);
      const cellHeight = buttonCellHeightStyle(height);
      const linkDisplay = buttonLinkDisplayStyle(width, height);
      const linkHeight = buttonLinkHeightStyle(height);
      const linkPadding = buttonLinkPaddingStyle(height, width);
      const innerAlign = buttonAlignAttr(block.style.align);
      const outerAlignStyle =
        width.unit === "fit-content" ? `text-align:${block.style.align};` : "";
      // The button color is rendered on the inner cell + <a>; keep it off the
      // full-width outer cell so it doesn't bleed across the row.
      return `<td style="padding:${pad(block.style)};${outerAlignStyle}${commonSuffix(block.style, true, true)}">
        <table role="presentation"${tableWidth}${tableAlign} cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">
          <tr>
            <td${innerAlign}${cellHeightAttr} bgcolor="${block.style.bgColor}" style="${cellWidth}${cellHeight}border-radius:${block.style.borderRadius}px;background-color:${block.style.bgColor};">
              <a href="${escapeHtml(block.content.href)}" target="_blank" style="${linkDisplay}${linkHeight}padding:${linkPadding};background-color:${block.style.bgColor};color:${block.style.textColor};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:normal;text-decoration:none;border-radius:${block.style.borderRadius}px;text-align:center;box-sizing:border-box;white-space:nowrap;">${escapeHtml(block.content.label)}</a>
            </td>
          </tr>
        </table>
      </td>`;
    }
    case "divider":
      return `<td style="padding:${pad(block.style)};${commonSuffix(block.style)}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-top:${block.style.thickness}px ${block.style.lineStyle ?? "solid"} ${block.style.color};font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>`;
    case "social": {
      const items = getSocialItems(block.content);
      const width = toDimension(block.style.width, dim(32));
      const height = toDimension(block.style.height, dim(32));
      const { widthAttr, heightAttr, style: imgStyle } = imageToHtmlAttrs(width, height);
      const size = Math.round(
        Math.max(width.unit === "px" ? width.value : 0, height.unit === "px" ? height.value : 0) * 2
      );
      const gap = Math.max(0, block.style.gap ?? 8);
      const groupWidth = width.unit === "px"
        ? dim(width.value * items.length + gap * Math.max(0, items.length - 1))
        : width;
      const rowCellWidth = imageRowCellWidthCss(groupWidth, !!ctx.inRowStack);
      const rowCellWidthAttr = imageRowCellWidthAttr(groupWidth, !!ctx.inRowStack);
      const cells = items.map((item, index) => {
        const url = socialIconUrl(item.platform, block.style.iconColor, size || 64);
        const label = SOCIAL_PLATFORMS[item.platform]?.label ?? item.platform;
        const href = item.href ? escapeHtml(item.href) : "#";
        const gapStyle = index > 0 ? `padding-left:${gap}px;` : "";
        const img = `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}"${widthAttr}${heightAttr} style="${imgStyle}" />`;
        return `<td style="${gapStyle}font-size:0;line-height:0;"><a href="${href}" target="_blank">${img}</a></td>`;
      }).join("");
      const align = block.style.align === "left" ? "left" : block.style.align === "right" ? "right" : "center";
      return `<td${rowCellWidthAttr} style="padding:${pad(block.style)};${rowCellWidth}text-align:${align};${commonSuffix(block.style)}"><table role="presentation" align="${align}" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table></td>`;
    }
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
      const nestedParentSized = stackHasHeight || !!ctx.parentHasHeight;
      const fillMain = !isRow && isFillHeight(stackH) && nestedParentSized;
      const contentTableHeight = stackContentTableFullHeight(block, nestedParentSized)
        ? "height:100%;"
        : "";
      const outerTdStyle = fillMain
        ? "padding:0;height:100%;vertical-align:top;"
        : "padding:0;";
      const outerTdAttrs = fillMain ? ' valign="top" height="100%"' : "";
      const innerPadStyle = fillMain ? `padding:${stackPad};height:100%;vertical-align:top;` : `padding:${stackPad};`;
      const innerPadAttrs = fillMain ? ' valign="top" height="100%"' : "";
      return `<td${outerTdAttrs} style="${outerTdStyle}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${widthDecl}${containerCss};${fillMain ? "height:100%;" : ""}">
          <tr>
            <td${innerPadAttrs} style="${innerPadStyle}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;${contentTableHeight}">
                ${buildStackRows(block, nestedParentSized)}
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
  const rootH = toDimension(root.style.height, dim(0, "fit-content"));
  const frameHeightCss =
    rootH.unit === "px" && rootH.value > 0 ? stackHeightCss(rootH) : "";

  return `<table id="crema-email" role="presentation" width="${canvasWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${canvasWidth}px;max-width:100%;box-sizing:border-box;background-color:#ffffff;${frameHeightCss}${containerCss};">
        <tr>
          <td id="crema-email-content" valign="top" style="padding:${rootPad};vertical-align:top;${frameHeightCss}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;${frameHeightCss}">
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
  td { vertical-align: top; }
  p { margin: 0; }
  #crema-email-content p + p,
  #crema-email-content ul,
  #crema-email-content ol { margin-top: 0.5em; }
  #crema-email-content strong { font-weight: 700; }
  img { border: 0; display: block; max-width: 100%; }
  #crema-email { box-sizing: border-box; line-height: normal; vertical-align: top; }
  #crema-email-content { vertical-align: top; }
  @media only screen and (max-width: 480px) {
    /* Stack multi-column row layouts vertically on mobile — compact rows (logo + label) stay inline. */
    .crema-stack-mobile td.crema-col { display: block !important; width: 100% !important; box-sizing: border-box; }
    .crema-stack-mobile td.crema-gap { display: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;line-height:0;background-color:${bodyBg};">
${bodyInner}
</body>
</html>`;
}
