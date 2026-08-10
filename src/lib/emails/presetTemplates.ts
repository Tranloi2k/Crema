import type { StackBlock } from "@/lib/types";
import { dim, sides } from "@/lib/types";
import { createWelcomeEmailTemplate } from "@/lib/emails/welcomeEmailTemplate";
import {
  PRESET_BORDER_LIGHT,
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
  description: string;
  templateName: string;
  build: () => StackBlock;
}

const BRAND = "#6d5dfc";
const INK = "#17132f";
const SOFT = "#f3f0ff";

function brandHeader(label: string, background = INK): StackBlock {
  return stack(
    "Header",
    [
      text("<p><strong>YOUR BRAND</strong></p>", {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 1.6,
        width: dim(0, "fill"),
      }, "Brand"),
      text(`<p><strong>${label}</strong></p>`, {
        color: "#c9c3ff",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.1,
        align: "right",
        width: dim(0, "fit-content"),
      }, "Header label"),
    ],
    {
      direction: "row",
      justify: "between",
      align: "center",
      bgColor: background,
      padding: { top: 22, right: 32, bottom: 22, left: 32, linked: false },
      border: {
        width: 0,
        color: background,
        style: "solid",
        radius: { topLeft: 16, topRight: 16, bottomRight: 0, bottomLeft: 0, linked: false },
      },
    }
  );
}

function footer(): StackBlock {
  return stack(
    "Footer",
    [
      text("<p><strong>YOUR BRAND</strong></p><p>Thoughtful emails, made simply.</p>", {
        color: "#ffffff",
        fontSize: 12,
        lineHeight: 1.6,
        width: dim(0, "fill"),
      }, "Footer brand"),
      text(
        '<p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p><p>&copy; 2026 Your Company</p>',
        {
          color: PRESET_TEXT_FOOTER,
          fontSize: 11,
          lineHeight: 1.6,
          align: "right",
          width: dim(0, "fill"),
        },
        "Legal"
      ),
    ],
    {
      direction: "row",
      justify: "between",
      align: "center",
      gap: 20,
      bgColor: INK,
      padding: { top: 24, right: 32, bottom: 24, left: 32, linked: false },
      border: {
        width: 0,
        color: INK,
        style: "solid",
        radius: { topLeft: 0, topRight: 0, bottomRight: 16, bottomLeft: 16, linked: false },
      },
    }
  );
}

function storyCard(index: string, title: string, copy: string): StackBlock {
  return stack(
    `Story ${index}`,
    [
      text(`<p><strong>${index}</strong></p>`, {
        color: BRAND,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1,
        width: dim(34, "px"),
      }, "Story number"),
      text(`<p><strong>${title}</strong></p><p>${copy}</p>`, {
        color: PRESET_TEXT_MUTED,
        fontSize: 14,
        lineHeight: 1.55,
        width: dim(0, "fill"),
      }, "Story summary"),
    ],
    {
      direction: "row",
      gap: 12,
      align: "start",
      padding: { top: 16, right: 0, bottom: 16, left: 0, linked: false },
    }
  );
}

/** Editorial newsletter with a lead feature and scan-friendly brief stories. */
function buildNewsletter(): StackBlock {
  return presetRoot([
    brandHeader("ISSUE 024 / WEEKLY"),
    stack(
      "Lead story",
      [
        text("<p><strong>FEATURED STORY</strong></p>", {
          color: BRAND,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.4,
          padding: { top: 0, right: 0, bottom: 12, left: 0, linked: false },
        }, "Category"),
        text("<p><strong>The ideas shaping what comes next</strong></p>", {
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.16,
          letterSpacing: -0.6,
          padding: { top: 0, right: 0, bottom: 16, left: 0, linked: false },
        }, "Headline"),
        text(
          "<p>A considered look at the trends, people, and practical lessons worth carrying into the week ahead.</p>",
          {
            color: PRESET_TEXT_MUTED,
            fontSize: 16,
            lineHeight: 1.65,
            padding: { top: 0, right: 0, bottom: 24, left: 0, linked: false },
          },
          "Introduction"
        ),
        image("https://placehold.co/536x260/17132f/f3f0ff?text=Featured+Story", "Featured story", 536, {
          border: { width: 0, color: INK, style: "solid", radius: 12 },
          padding: { top: 0, right: 0, bottom: 24, left: 0, linked: false },
        }),
        button("Read the story \u2192", "https://example.com/story", BRAND),
      ],
      {
        bgColor: "#faf9fd",
        padding: { top: 38, right: 32, bottom: 38, left: 32, linked: false },
      }
    ),
    stack(
      "In brief",
      [
        text("<p><strong>IN BRIEF</strong></p>", {
          color: BRAND,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.4,
          padding: { top: 0, right: 0, bottom: 4, left: 0, linked: false },
        }, "Section label"),
        storyCard("01", "A smarter way to start", "One useful idea your readers can put into practice today."),
        divider(),
        storyCard("02", "Worth bookmarking", "A concise secondary update with a clear reason to care."),
        divider(),
        storyCard("03", "One last thought", "Close the issue with a memorable observation or recommendation."),
      ],
      { padding: { top: 30, right: 32, bottom: 30, left: 32, linked: false } }
    ),
    footer(),
  ], "#ffffff");
}

function feature(number: string, title: string, copy: string): StackBlock {
  return stack(
    `Feature ${number}`,
    [
      text(`<p><strong>${number}</strong></p>`, {
        color: BRAND,
        bgColor: SOFT,
        fontSize: 13,
        fontWeight: 700,
        align: "center",
        width: dim(36, "px"),
        padding: { top: 8, right: 0, bottom: 8, left: 0, linked: false },
        border: { width: 0, color: SOFT, style: "solid", radius: 18 },
      }, "Feature number"),
      text(`<p><strong>${title}</strong></p><p>${copy}</p>`, {
        color: PRESET_TEXT_MUTED,
        fontSize: 14,
        lineHeight: 1.55,
        width: dim(0, "fill"),
      }, "Feature copy"),
    ],
    {
      direction: "row",
      gap: 14,
      align: "center",
      bgColor: "#ffffff",
      padding: sides(16, false),
      border: { width: 1, color: PRESET_BORDER_LIGHT, style: "solid", radius: 12 },
    }
  );
}

/** Product announcement with a focused hero, benefits, and launch CTA. */
function buildAnnouncement(): StackBlock {
  return presetRoot([
    brandHeader("PRODUCT UPDATE"),
    stack(
      "Announcement hero",
      [
        text("<p><strong>NOW AVAILABLE</strong></p>", {
          color: BRAND,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.4,
          align: "center",
          padding: { top: 0, right: 0, bottom: 14, left: 0, linked: false },
        }, "Eyebrow"),
        text("<p><strong>Meet the new way<br>to move faster</strong></p>", {
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.16,
          letterSpacing: -0.6,
          align: "center",
          padding: { top: 0, right: 0, bottom: 16, left: 0, linked: false },
        }, "Headline"),
        text(
          "<p>Introduce your launch with one clear promise. Show readers what changed and how it makes their day better.</p>",
          {
            color: PRESET_TEXT_MUTED,
            fontSize: 16,
            lineHeight: 1.6,
            align: "center",
            padding: { top: 0, right: 30, bottom: 26, left: 30, linked: false },
          },
          "Introduction"
        ),
        stack("CTA row", [button("Explore what's new \u2192", "https://example.com", BRAND)], {
          align: "center",
          justify: "center",
        }),
      ],
      {
        bgColor: SOFT,
        align: "center",
        padding: { top: 42, right: 32, bottom: 42, left: 32, linked: false },
      }
    ),
    stack(
      "Highlights",
      [
        text("<p><strong>Built around the way you work</strong></p>", {
          fontSize: 20,
          fontWeight: 700,
          padding: { top: 0, right: 0, bottom: 6, left: 0, linked: false },
        }, "Section title"),
        text("<p>Three concise reasons to try the new experience.</p>", {
          color: PRESET_TEXT_MUTED,
          fontSize: 14,
          padding: { top: 0, right: 0, bottom: 14, left: 0, linked: false },
        }, "Section introduction"),
        feature("01", "Simple from the start", "A clear experience that needs no learning curve."),
        feature("02", "Faster every day", "Remove repetitive work and keep momentum high."),
        feature("03", "Ready for your team", "Share progress and keep everyone aligned."),
      ],
      {
        gap: 10,
        padding: { top: 32, right: 32, bottom: 32, left: 32, linked: false },
      }
    ),
    footer(),
  ]);
}

/** High-energy promotion with a strong offer and memorable coupon treatment. */
function buildPromo(): StackBlock {
  const SALE = "#ff4f72";

  return presetRoot([
    brandHeader("MEMBER EXCLUSIVE", "#21162a"),
    stack(
      "Sale hero",
      [
        text("<p><strong>48 HOURS ONLY</strong></p>", {
          color: "#ffe0e7",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          align: "center",
          padding: { top: 0, right: 0, bottom: 12, left: 0, linked: false },
        }, "Offer label"),
        text("<p><strong>25% off<br>your favorites</strong></p>", {
          color: "#ffffff",
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -0.8,
          align: "center",
          padding: { top: 0, right: 0, bottom: 14, left: 0, linked: false },
        }, "Offer"),
        text("<p>A short-lived offer for the products your customers already love.</p>", {
          color: "#fff1f4",
          fontSize: 15,
          lineHeight: 1.55,
          align: "center",
        }, "Offer description"),
      ],
      {
        bgColor: SALE,
        align: "center",
        padding: { top: 38, right: 32, bottom: 38, left: 32, linked: false },
      }
    ),
    stack(
      "Promotion body",
      [
        image("https://placehold.co/536x260/21162a/fff1f4?text=Your+Product", "Featured products", 536, {
          border: { width: 0, color: INK, style: "solid", radius: 12 },
        }),
        text("<p>Refresh your collection while the offer lasts. Add a concise product benefit here to make the decision effortless.</p>", {
          color: PRESET_TEXT_MUTED,
          fontSize: 15,
          lineHeight: 1.6,
          align: "center",
          padding: { top: 22, right: 18, bottom: 18, left: 18, linked: false },
        }, "Promotion copy"),
        stack(
          "Coupon",
          [
            text("<p>USE CODE</p>", {
              color: PRESET_TEXT_MUTED,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              align: "center",
              padding: { top: 0, right: 0, bottom: 4, left: 0, linked: false },
            }, "Coupon label"),
            text("<p><strong>SAVE25</strong></p>", {
              color: INK,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              align: "center",
            }, "Coupon code"),
          ],
          {
            bgColor: "#fff4f6",
            align: "center",
            padding: { top: 14, right: 24, bottom: 14, left: 24, linked: false },
            border: { width: 1, color: "#ffc7d3", style: "dashed", radius: 10 },
          }
        ),
        stack("CTA row", [button("Shop the offer \u2192", "https://example.com/shop", SALE, {
          borderRadius: 999,
        })], {
          align: "center",
          justify: "center",
          padding: { top: 22, right: 0, bottom: 0, left: 0, linked: false },
        }),
        text("<p>Offer ends Sunday at midnight. Exclusions may apply.</p>", {
          color: PRESET_TEXT_FOOTER,
          fontSize: 11,
          align: "center",
          padding: { top: 14, right: 0, bottom: 0, left: 0, linked: false },
        }, "Fine print"),
      ],
      { padding: { top: 28, right: 32, bottom: 32, left: 32, linked: false } }
    ),
    footer(),
  ]);
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "welcome",
    name: "Welcome",
    description: "Polished onboarding with clear next steps and a focused CTA.",
    templateName: "Welcome email",
    build: () => createWelcomeEmailTemplate({ useMergeTags: true }),
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Editorial weekly digest with a lead story and quick reads.",
    templateName: "Newsletter",
    build: buildNewsletter,
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Product launch layout with benefits and a focused call-to-action.",
    templateName: "Announcement",
    build: buildAnnouncement,
  },
  {
    id: "promo",
    name: "Promotion",
    description: "High-impact sale campaign with coupon and prominent CTA.",
    templateName: "Promotion",
    build: buildPromo,
  },
];

export function getPresetTemplate(id: string): PresetTemplate | undefined {
  return PRESET_TEMPLATES.find((preset) => preset.id === id);
}
