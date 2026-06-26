import type { Block } from "@/lib/types";
import { TextBlock } from "@/components/builder/blocks/TextBlock";
import { ImageBlock } from "@/components/builder/blocks/ImageBlock";
import { ButtonBlock } from "@/components/builder/blocks/ButtonBlock";
import { DividerBlock } from "@/components/builder/blocks/DividerBlock";
import { SpacerBlock } from "@/components/builder/blocks/SpacerBlock";
import { StackBlock } from "@/components/builder/blocks/StackBlock";
import { SocialBlock } from "@/components/builder/blocks/SocialBlock";

export function BlockRenderer({
  block,
  compactWidth,
  crossAxisFill,
}: {
  block: Block;
  compactWidth?: boolean;
  crossAxisFill?: boolean;
}) {
  switch (block.type) {
    case "text":
      return <TextBlock block={block} compactWidth={compactWidth} crossAxisFill={crossAxisFill} />;
    case "image":
      return <ImageBlock block={block} compactWidth={compactWidth} />;
    case "button":
      return <ButtonBlock block={block} />;
    case "divider":
      return <DividerBlock block={block} />;
    case "spacer":
      return <SpacerBlock block={block} />;
    case "stack":
      return <StackBlock block={block} />;
    case "social":
      return <SocialBlock block={block} compactWidth={compactWidth} />;
  }
}
