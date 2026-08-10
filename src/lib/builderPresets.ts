import { createBlock } from "@/lib/defaultBlocks";
import { dim } from "@/lib/types";
import type {
  ButtonBlock,
  ImageBlock,
  SocialBlock,
  StackBlock,
  TextBlock,
} from "@/lib/types";

export type SectionPresetId = "hero" | "content" | "cta" | "footer";

function text(html: string, name: string, options?: Partial<TextBlock["style"]>): TextBlock {
  const block = createBlock("text") as TextBlock;
  return {
    ...block,
    name,
    content: { html },
    style: { ...block.style, ...options },
  };
}

function button(label: string): ButtonBlock {
  const block = createBlock("button") as ButtonBlock;
  return { ...block, name: "Action button", content: { ...block.content, label } };
}

function layout(name: string): StackBlock {
  const block = createBlock("stack") as StackBlock;
  return {
    ...block,
    name,
    style: {
      ...block.style,
      gap: 12,
      padding: 32,
      align: "center",
      bgColor: "#ffffff",
    },
  };
}

export function createPresetSection(id: SectionPresetId): StackBlock {
  if (id === "hero") {
    const section = layout("Hero section");
    const image = createBlock("image") as ImageBlock;
    return {
      ...section,
      style: { ...section.style, bgColor: "#f8fafc", gap: 14 },
      children: [
        { ...image, name: "Hero image", content: { ...image.content, src: "https://placehold.co/536x220/e2e8f0/475569?text=Your+image", alt: "Hero image" }, style: { ...image.style, width: dim(536) } },
        text("<h1>Your headline goes here</h1>", "Headline", { fontSize: 32, fontWeight: 700, align: "center", padding: 8 }),
        text("<p>Add a short message that tells readers why this email matters.</p>", "Introduction", { color: "#64748b", align: "center", padding: 4 }),
        button("Get started"),
      ],
    };
  }

  if (id === "content") {
    const section = layout("Content section");
    return {
      ...section,
      style: { ...section.style, align: "start" },
      children: [
        text("<h2>Tell your story</h2>", "Section heading", { fontSize: 24, fontWeight: 700, padding: 4 }),
        text("<p>Use this space to explain your update, share useful details, or introduce a new idea to your audience.</p>", "Body copy", { color: "#475569", padding: 4 }),
      ],
    };
  }

  if (id === "cta") {
    const section = layout("Call to action");
    return {
      ...section,
      style: { ...section.style, bgColor: "#f1f5f9", padding: 28 },
      children: [
        text("<h2>Ready to take the next step?</h2>", "CTA heading", { fontSize: 24, fontWeight: 700, align: "center", padding: 4 }),
        text("<p>Give readers one clear reason to continue.</p>", "CTA description", { color: "#64748b", align: "center", padding: 4 }),
        button("Learn more"),
      ],
    };
  }

  const section = layout("Footer");
  const social = createBlock("social") as SocialBlock;
  return {
    ...section,
    style: { ...section.style, border: { ...section.style.border, width: 0 }, padding: 24 },
    children: [
      text("<p>Thanks for reading.</p>", "Footer message", { align: "center", fontWeight: 600, padding: 4 }),
      { ...social, name: "Social links" },
      text("<p>You received this email because you subscribed to our updates.</p>", "Legal text", { align: "center", color: "#94a3b8", fontSize: 12, padding: 4 }),
    ],
  };
}
