import type { StackBlock } from "@/lib/types";
import { sides } from "@/lib/types";
import { createWelcomeEmailTemplate } from "@/lib/emails/welcomeEmailTemplate";
import {
  PRESET_TEXT_FOOTER,
  PRESET_TEXT_MUTED,
  button,
  divider,
  image,
  presetRoot,
  stack,
  text,
} from "@/lib/emails/presetBlocks";

export interface PresetTemplate {
  id: string;
  name: string;
  /** One-line summary shown in the gallery card. */
  description: string;
  /** Default name applied to the created template. */
  templateName: string;
  build: () => StackBlock;
}

const BRAND = "#5046e5";

function footer(): StackBlock {
  return stack(
    "Footer",
    [
      text(
        "<p>© 2026 Your Company. All rights reserved.</p>",
        { color: PRESET_TEXT_FOOTER, fontSize: 12, align: "center" },
        "Copyright"
      ),
      text(
        '<p><a href="{{ unsubscribe_url }}">Unsubscribe</a> · 123 Market St, Your City</p>',
        { color: PRESET_TEXT_FOOTER, fontSize: 12, align: "center" },
        "Legal"
      ),
    ],
    { gap: 6, padding: { top: 20, right: 24, bottom: 24, left: 24, linked: false } }
  );
}

/** Newsletter: header, lead story, secondary note, CTA, footer. */
function buildNewsletter(): StackBlock {
  return presetRoot([
    stack(
      "Header",
      [
        text("<p><strong>THE WEEKLY</strong></p>", {
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
          align: "center",
        }),
      ],
      {
        bgColor: BRAND,
        padding: { top: 18, right: 24, bottom: 18, left: 24, linked: false },
      }
    ),
    stack(
      "Body",
      [
        text("<p><strong>This week's top story</strong></p>", {
          fontSize: 24,
          fontWeight: 700,
          padding: { top: 0, right: 0, bottom: 8, left: 0, linked: false },
        }),
        text(
          "<p>A short, punchy summary of your lead story goes here. Keep it to a couple of sentences so readers can scan quickly and click through for more.</p>",
          {
            color: PRESET_TEXT_MUTED,
            padding: { top: 0, right: 0, bottom: 16, left: 0, linked: false },
          }
        ),
        button("Read more", "https://example.com/story", BRAND),
        divider(),
        text("<p><strong>Also worth a look</strong></p>", {
          fontSize: 16,
          fontWeight: 600,
          padding: { top: 16, right: 0, bottom: 6, left: 0, linked: false },
        }),
        text(
          "<ul><li>A second highlight with a brief description</li><li>A third item to round out the issue</li></ul>",
          { color: PRESET_TEXT_MUTED }
        ),
      ],
      { padding: sides(24, false) }
    ),
    footer(),
  ]);
}

/** Announcement: centered headline, supporting copy, single CTA. */
function buildAnnouncement(): StackBlock {
  return presetRoot([
    stack(
      "Body",
      [
        text("<p>🎉</p>", { fontSize: 40, align: "center", padding: { top: 8, right: 0, bottom: 8, left: 0, linked: false } }),
        text("<p><strong>We've got something new</strong></p>", {
          fontSize: 28,
          fontWeight: 700,
          align: "center",
          padding: { top: 0, right: 0, bottom: 12, left: 0, linked: false },
        }),
        text(
          "<p>Introduce your announcement in a sentence or two. Tell readers what changed and why it matters to them.</p>",
          {
            color: PRESET_TEXT_MUTED,
            align: "center",
            padding: { top: 0, right: 0, bottom: 24, left: 0, linked: false },
          }
        ),
        stack(
          "CTA row",
          [button("Learn more", "https://example.com", BRAND)],
          { align: "center", justify: "center", padding: sides(0) }
        ),
      ],
      { padding: { top: 40, right: 32, bottom: 40, left: 32, linked: false } }
    ),
    divider(),
    footer(),
  ]);
}

/** Promotion: bold offer, image placeholder, prominent CTA, fine print. */
function buildPromo(): StackBlock {
  return presetRoot([
    stack(
      "Hero",
      [
        text("<p><strong>LIMITED TIME OFFER</strong></p>", {
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
          align: "center",
          padding: { top: 0, right: 0, bottom: 6, left: 0, linked: false },
        }),
        text("<p><strong>Save 25% this week</strong></p>", {
          color: "#ffffff",
          fontSize: 32,
          fontWeight: 700,
          align: "center",
        }),
      ],
      {
        bgColor: "#111827",
        padding: { top: 32, right: 24, bottom: 32, left: 24, linked: false },
      }
    ),
    stack(
      "Body",
      [
        image("https://placehold.co/552x240", "Product promotion"),
        text(
          "<p>Describe the offer and what's included. Create urgency with a clear deadline so readers act now.</p>",
          {
            color: PRESET_TEXT_MUTED,
            align: "center",
            padding: { top: 16, right: 0, bottom: 20, left: 0, linked: false },
          }
        ),
        stack(
          "CTA row",
          [
            button("Shop the sale", "https://example.com/shop", "#e11d48", {
              borderRadius: 999,
            }),
          ],
          { align: "center", justify: "center", padding: sides(0) }
        ),
        text("<p>Offer ends Sunday at midnight. Terms apply.</p>", {
          color: PRESET_TEXT_FOOTER,
          fontSize: 12,
          align: "center",
          padding: { top: 16, right: 0, bottom: 0, left: 0, linked: false },
        }),
      ],
      { padding: sides(24, false) }
    ),
    footer(),
  ]);
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "welcome",
    name: "Welcome",
    description: "Onboarding email greeting new users with next steps.",
    templateName: "Welcome email",
    build: () => createWelcomeEmailTemplate({ useMergeTags: true }),
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Weekly digest with a lead story and secondary links.",
    templateName: "Newsletter",
    build: buildNewsletter,
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Centered headline and single call-to-action.",
    templateName: "Announcement",
    build: buildAnnouncement,
  },
  {
    id: "promo",
    name: "Promotion",
    description: "Bold sale hero, product image, and prominent CTA.",
    templateName: "Promotion",
    build: buildPromo,
  },
];

export function getPresetTemplate(id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find((p) => p.id === id);
}
