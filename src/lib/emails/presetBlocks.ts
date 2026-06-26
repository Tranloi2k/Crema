import type {
  Block,
  ButtonBlock,
  DividerBlock,
  ImageBlock,
  StackBlock,
  TextBlock,
} from "@/lib/types";
import {
  DEFAULT_COMMON_STYLE,
  DEFAULT_FONT_FAMILY,
  dim,
  sides,
} from "@/lib/types";
import { ROOT_ID } from "@/lib/defaultBlocks";

// Shared block factory helpers for preset email templates. Mirrors the patterns
// in welcomeEmailTemplate.ts so every preset produces inbox-ready, editable blocks.

export const PRESET_TEXT_PRIMARY = "#111827";
export const PRESET_TEXT_MUTED = "#6b7280";
export const PRESET_TEXT_FOOTER = "#9ca3af";
export const PRESET_BORDER_LIGHT = "#e5e7eb";

let presetCounter = 0;
function pid(prefix: string): string {
  presetCounter += 1;
  return `${prefix}-${presetCounter}`;
}

export function text(
  html: string,
  style: Partial<TextBlock["style"]> = {},
  name = "Text"
): TextBlock {
  return {
    id: pid("text"),
    type: "text",
    name,
    content: { html },
    style: {
      ...DEFAULT_COMMON_STYLE,
      align: "left",
      color: PRESET_TEXT_PRIMARY,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: 400,
      textTransform: "none",
      textDecoration: "none",
      fontStyle: "normal",
      verticalAlign: "top",
      width: dim(0, "fill"),
      height: dim(0, "fit-content"),
      padding: 0,
      ...style,
    },
  };
}

export function button(
  label: string,
  href: string,
  bgColor = "#5046e5",
  style: Partial<ButtonBlock["style"]> = {}
): ButtonBlock {
  return {
    id: pid("button"),
    type: "button",
    name: "CTA",
    content: { label, href },
    style: {
      ...DEFAULT_COMMON_STYLE,
      align: "left",
      bgColor,
      textColor: "#ffffff",
      borderRadius: 8,
      width: dim(0, "fit-content"),
      height: dim(0, "fit-content"),
      padding: sides(0),
      ...style,
    },
  };
}

export function image(
  src: string,
  alt: string,
  width = 552,
  style: Partial<ImageBlock["style"]> = {}
): ImageBlock {
  return {
    id: pid("image"),
    type: "image",
    name: "Image",
    content: { src, alt, href: "" },
    style: {
      ...DEFAULT_COMMON_STYLE,
      width: dim(width),
      height: dim(0, "fit-content"),
      align: "center",
      padding: sides(0),
      ...style,
    },
  };
}

export function divider(color = PRESET_BORDER_LIGHT): DividerBlock {
  return {
    id: pid("divider"),
    type: "divider",
    name: "Divider",
    content: {},
    style: { ...DEFAULT_COMMON_STYLE, color, thickness: 1, padding: sides(0) },
  };
}

export function stack(
  name: string,
  children: Block[],
  style: Partial<StackBlock["style"]> = {}
): StackBlock {
  return {
    id: pid("stack"),
    type: "stack",
    name,
    content: {},
    style: {
      ...DEFAULT_COMMON_STYLE,
      direction: "column",
      gap: 0,
      padding: sides(0),
      justify: "start",
      align: "start",
      width: dim(0, "fill"),
      height: dim(0, "fit-content"),
      ...style,
    },
    children,
  };
}

/** Wraps preset sections in the always-present 600px-wide root Stack. */
export function presetRoot(children: Block[], bgColor = "#ffffff"): StackBlock {
  presetCounter = 0;
  return {
    id: ROOT_ID,
    type: "stack",
    name: "Email",
    content: {},
    style: {
      ...DEFAULT_COMMON_STYLE,
      direction: "column",
      gap: 0,
      padding: sides(0),
      justify: "start",
      align: "start",
      width: dim(600, "px"),
      height: dim(0, "fit-content"),
      bgColor,
    },
    children,
  };
}
