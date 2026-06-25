/** Horizontal step per nesting level in the Layers panel. */
export const LAYER_INDENT = 14;
/** Left padding for depth-0 rows. */
export const LAYER_BASE_PADDING = 8;
/** Chevron / spacer column + gap before the layer icon. */
export const LAYER_ROW_CHROME = 18;

export function layerRowPadding(depth: number): number {
  return depth * LAYER_INDENT + LAYER_BASE_PADDING;
}

/** Align nested labels (e.g. "Empty") one tab inside the parent Stack row. */
export function layerNestedPadding(depth: number): number {
  return layerRowPadding(depth) + LAYER_ROW_CHROME;
}
