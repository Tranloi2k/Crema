import type { Block, ButtonBlock, StackBlock, TextBlock } from "@/lib/types";
import {
  DEFAULT_COMMON_STYLE,
  DEFAULT_FONT_FAMILY,
  dim,
  sides,
} from "@/lib/types";
import { ROOT_ID } from "@/lib/defaultBlocks";
import { getAppBaseUrl } from "@/lib/appUrl";

export const WELCOME_EMAIL_SUBJECT = "Welcome to Crema - let's build your first email";
export const WELCOME_EMAIL_TEMPLATE_NAME = "Welcome email (new users)";

const BRAND_PRIMARY = "#6d5dfc";
const BRAND_DARK = "#17132f";
const BRAND_SOFT = "#f3f0ff";
const TEXT_PRIMARY = "#19162b";
const TEXT_MUTED = "#68647a";
const TEXT_FOOTER = "#918da3";
const BORDER_LIGHT = "#e8e5f0";

export type WelcomeEmailTemplateOptions = {
  firstName?: string;
  useMergeTags?: boolean;
  dashboardUrl?: string;
};

function greetingName(options: WelcomeEmailTemplateOptions): string {
  if (options.useMergeTags) return "{{ params.name }}";
  const raw = options.firstName?.trim();
  return raw && raw.length > 0 ? raw : "there";
}

function dashboardHref(options: WelcomeEmailTemplateOptions): string {
  if (options.useMergeTags) return "{{ params.dashboard_url }}";
  return options.dashboardUrl ?? `${getAppBaseUrl()}/dashboard`;
}

function textBlock(
  id: string,
  name: string,
  html: string,
  style: Partial<TextBlock["style"]>
): TextBlock {
  return {
    id,
    type: "text",
    name,
    content: { html },
    style: {
      ...DEFAULT_COMMON_STYLE,
      align: "left",
      color: TEXT_PRIMARY,
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

function buttonBlock(
  id: string,
  label: string,
  href: string,
  align: ButtonBlock["style"]["align"] = "left"
): ButtonBlock {
  return {
    id,
    type: "button",
    name: "CTA",
    content: { label, href },
    style: {
      ...DEFAULT_COMMON_STYLE,
      align,
      bgColor: BRAND_PRIMARY,
      textColor: "#ffffff",
      borderRadius: 10,
      width: dim(0, "fit-content"),
      height: dim(0, "fit-content"),
      padding: sides(0),
    },
  };
}

function stackBlock(
  id: string,
  name: string,
  children: Block[],
  style: Partial<StackBlock["style"]>
): StackBlock {
  return {
    id,
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

function step(number: string, title: string, description: string): StackBlock {
  return stackBlock(
    `welcome-step-${number}`,
    `Step ${number}`,
    [
      textBlock(
        `welcome-step-${number}-number`,
        `Step ${number} number`,
        `<p><strong>${number}</strong></p>`,
        {
          color: BRAND_PRIMARY,
          bgColor: BRAND_SOFT,
          fontSize: 14,
          fontWeight: 700,
          align: "center",
          width: dim(38, "px"),
          padding: { top: 9, right: 0, bottom: 9, left: 0, linked: false },
          border: { width: 0, color: BRAND_SOFT, style: "solid", radius: 19 },
        }
      ),
      textBlock(
        `welcome-step-${number}-copy`,
        `Step ${number} copy`,
        `<p><strong>${title}</strong></p><p>${description}</p>`,
        {
          color: TEXT_MUTED,
          fontSize: 14,
          lineHeight: 1.55,
          width: dim(0, "fill"),
          padding: sides(0),
        }
      ),
    ],
    {
      direction: "row",
      gap: 14,
      align: "center",
      bgColor: "#ffffff",
      padding: sides(16, false),
      border: { width: 1, color: BORDER_LIGHT, style: "solid", radius: 12 },
    }
  );
}

/** Inbox-ready welcome email shared by the editor preset and transactional send. */
export function createWelcomeEmailTemplate(
  options: WelcomeEmailTemplateOptions = {}
): StackBlock {
  const name = greetingName(options);
  const dashboardUrl = dashboardHref(options);

  const header = stackBlock(
    "welcome-header",
    "Header",
    [
      textBlock("welcome-logo", "Brand", "<p><strong>CREMA</strong></p>", {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 2,
        width: dim(0, "fill"),
        padding: sides(0),
      }),
      textBlock(
        "welcome-header-label",
        "Header label",
        "<p><strong>EMAIL BUILDER</strong></p>",
        {
          color: "#c9c3ff",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          align: "right",
          width: dim(0, "fit-content"),
          padding: sides(0),
        }
      ),
    ],
    {
      direction: "row",
      justify: "between",
      align: "center",
      bgColor: BRAND_DARK,
      padding: { top: 22, right: 32, bottom: 22, left: 32, linked: false },
      border: {
        width: 0,
        color: BORDER_LIGHT,
        style: "solid",
        radius: { topLeft: 16, topRight: 16, bottomRight: 0, bottomLeft: 0, linked: false },
      },
    }
  );

  const hero = stackBlock(
    "welcome-hero",
    "Hero",
    [
      textBlock(
        "welcome-eyebrow",
        "Eyebrow",
        "<p><strong>YOUR CREATIVE WORKSPACE IS READY</strong></p>",
        {
          color: BRAND_PRIMARY,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.4,
          align: "center",
          padding: { top: 0, right: 0, bottom: 14, left: 0, linked: false },
        }
      ),
      textBlock("welcome-title", "Headline", `<p><strong>Welcome to Crema,<br>${name}.</strong></p>`, {
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: -0.6,
        align: "center",
        padding: { top: 0, right: 0, bottom: 16, left: 0, linked: false },
      }),
      textBlock(
        "welcome-intro",
        "Intro",
        "<p>Turn ideas into polished, inbox-ready emails with a visual builder made for speed.</p>",
        {
          color: TEXT_MUTED,
          fontSize: 16,
          lineHeight: 1.6,
          align: "center",
          padding: { top: 0, right: 36, bottom: 24, left: 36, linked: false },
        }
      ),
      buttonBlock("welcome-cta", "Start creating \u2192", dashboardUrl, "center"),
    ],
    {
      bgColor: BRAND_SOFT,
      align: "center",
      padding: { top: 38, right: 32, bottom: 40, left: 32, linked: false },
    }
  );

  const gettingStarted = stackBlock(
    "welcome-getting-started",
    "Getting started",
    [
      textBlock(
        "welcome-section-title",
        "Section title",
        "<p><strong>Create something great in minutes</strong></p>",
        {
          fontSize: 20,
          fontWeight: 700,
          padding: { top: 0, right: 0, bottom: 4, left: 0, linked: false },
        }
      ),
      textBlock(
        "welcome-section-intro",
        "Section intro",
        "<p>Your first campaign is only three small steps away.</p>",
        {
          color: TEXT_MUTED,
          fontSize: 14,
          padding: { top: 0, right: 0, bottom: 14, left: 0, linked: false },
        }
      ),
      step("01", "Choose a starting point", "Begin from a preset or a clean canvas."),
      step("02", "Make it yours", "Drag in content, tune the details, and add merge tags."),
      step("03", "Preview and export", "Check every screen size, then copy production-ready HTML."),
    ],
    {
      gap: 10,
      padding: { top: 32, right: 32, bottom: 24, left: 32, linked: false },
    }
  );

  const tip = stackBlock(
    "welcome-tip",
    "Pro tip",
    [
      textBlock(
        "welcome-tip-copy",
        "Pro tip copy",
        "<p><strong>Quick tip:</strong> Send yourself a test email before exporting to see exactly how your design feels in a real inbox.</p>",
        {
          color: "#514b70",
          fontSize: 13,
          lineHeight: 1.55,
          padding: sides(0),
        }
      ),
    ],
    {
      bgColor: "#f8f7fc",
      padding: { top: 16, right: 18, bottom: 16, left: 18, linked: false },
      border: { width: 1, color: BORDER_LIGHT, style: "solid", radius: 10 },
    }
  );

  const tipWrapper = stackBlock("welcome-tip-wrapper", "Tip wrapper", [tip], {
    padding: { top: 0, right: 32, bottom: 32, left: 32, linked: false },
  });

  const footer = stackBlock(
    "welcome-footer",
    "Footer",
    [
      textBlock("welcome-footer-left", "Copyright", "<p>&copy; 2026 Crema</p>", {
        color: TEXT_FOOTER,
        fontSize: 12,
        width: dim(0, "fill"),
        padding: sides(0),
      }),
      textBlock("welcome-footer-right", "Tagline", "<p>Made for better inboxes.</p>", {
        color: TEXT_FOOTER,
        fontSize: 12,
        align: "right",
        width: dim(0, "fill"),
        padding: sides(0),
      }),
    ],
    {
      direction: "row",
      gap: 12,
      justify: "between",
      align: "center",
      bgColor: BRAND_DARK,
      padding: { top: 20, right: 32, bottom: 20, left: 32, linked: false },
      border: {
        width: 0,
        color: BRAND_DARK,
        style: "solid",
        radius: { topLeft: 0, topRight: 0, bottomRight: 16, bottomLeft: 16, linked: false },
      },
    }
  );

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
      bgColor: "#ffffff",
      border: { width: 1, color: BORDER_LIGHT, style: "solid", radius: 16 },
    },
    children: [header, hero, gettingStarted, tipWrapper, footer],
  };
}
