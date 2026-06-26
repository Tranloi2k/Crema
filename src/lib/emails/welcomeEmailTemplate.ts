import type {
  Block,
  ButtonBlock,
  DividerBlock,
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
import { getAppBaseUrl } from "@/lib/appUrl";

export const WELCOME_EMAIL_SUBJECT = "Welcome to Crema — let's build your first email";
export const WELCOME_EMAIL_TEMPLATE_NAME = "Welcome email (new users)";

const BRAND_PRIMARY = "#5046e5";
const TEXT_PRIMARY = "#111827";
const TEXT_MUTED = "#6b7280";
const TEXT_FOOTER = "#9ca3af";
const BORDER_LIGHT = "#e5e7eb";

export type WelcomeEmailTemplateOptions = {
  /** Recipient first name — injected into copy when not using merge tags. */
  firstName?: string;
  /** Use Brevo-style {{ params.* }} placeholders for the editor preset. */
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

function buttonBlock(id: string, label: string, href: string): ButtonBlock {
  return {
    id,
    type: "button",
    name: "CTA",
    content: { label, href },
    style: {
      ...DEFAULT_COMMON_STYLE,
      align: "left",
      bgColor: BRAND_PRIMARY,
      textColor: "#ffffff",
      borderRadius: 8,
      width: dim(0, "fit-content"),
      height: dim(0, "fit-content"),
      padding: sides(0),
    },
  };
}

function dividerBlock(id: string): DividerBlock {
  return {
    id,
    type: "divider",
    name: "Divider",
    content: {},
    style: {
      ...DEFAULT_COMMON_STYLE,
      color: BORDER_LIGHT,
      thickness: 1,
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

/** Inbox-ready welcome email — usable in the editor, preview, export, and transactional send. */
export function createWelcomeEmailTemplate(
  options: WelcomeEmailTemplateOptions = {}
): StackBlock {
  const name = greetingName(options);
  const dashboardUrl = dashboardHref(options);

  const header = stackBlock(
    "welcome-header",
    "Header",
    [
      textBlock(
        "welcome-logo",
        "Brand",
        "<p><strong>CREMA</strong></p>",
        {
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          padding: sides(0),
        }
      ),
    ],
    {
      bgColor: BRAND_PRIMARY,
      padding: { top: 20, right: 24, bottom: 20, left: 24, linked: false },
      border: {
        width: 0,
        color: BORDER_LIGHT,
        style: "solid",
        radius: { topLeft: 0, topRight: 0, bottomRight: 12, bottomLeft: 12, linked: false },
      },
    }
  );

  const body = stackBlock(
    "welcome-body",
    "Body",
    [
      textBlock(
        "welcome-title",
        "Headline",
        `<p><strong>Welcome, ${name}!</strong></p>`,
        {
          fontSize: 26,
          fontWeight: 700,
          padding: { top: 0, right: 0, bottom: 12, left: 0, linked: false },
        }
      ),
      textBlock(
        "welcome-intro",
        "Intro",
        `<p>Thanks for joining <strong>Crema</strong> — the drag-and-drop email builder for inbox-ready HTML templates.</p>`,
        {
          color: TEXT_MUTED,
          fontSize: 16,
          padding: { top: 0, right: 0, bottom: 16, left: 0, linked: false },
        }
      ),
      textBlock(
        "welcome-steps",
        "Steps",
        `<p>Here's how to get started:</p><ul><li>Open your dashboard and create a template</li><li>Drag blocks — text, images, buttons, stacks</li><li>Preview on desktop &amp; mobile, then export HTML</li><li>Use merge tags for Brevo, Mailchimp, and more</li></ul>`,
        {
          color: TEXT_MUTED,
          fontSize: 15,
          padding: { top: 0, right: 0, bottom: 20, left: 0, linked: false },
        }
      ),
      buttonBlock("welcome-cta", "Go to dashboard", dashboardUrl),
    ],
    {
      height: dim(0, "fill"),
      padding: sides(24, false),
    }
  );

  const footer = stackBlock(
    "welcome-footer",
    "Footer",
    [
      textBlock(
        "welcome-footer-left",
        "Copyright",
        "<p>© 2026 Crema. All rights reserved.</p>",
        {
          color: TEXT_FOOTER,
          fontSize: 12,
          width: dim(0, "fill"),
          padding: sides(0),
        }
      ),
      textBlock(
        "welcome-footer-right",
        "Tagline",
        "<p>Build and export email templates.</p>",
        {
          color: TEXT_FOOTER,
          fontSize: 12,
          align: "right",
          width: dim(0, "fill"),
          padding: sides(0),
        }
      ),
    ],
    {
      direction: "row",
      gap: 12,
      justify: "between",
      align: "center",
      padding: { top: 16, right: 24, bottom: 20, left: 24, linked: false },
    }
  );

  const divider = dividerBlock("welcome-divider");
  divider.style.padding = { top: 0, right: 24, bottom: 0, left: 24, linked: false };

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
      height: dim(600, "px"),
      bgColor: "#ffffff",
    },
    children: [header, body, divider, footer],
  };
}
