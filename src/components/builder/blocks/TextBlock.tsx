"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import type { TextBlock as TextBlockType } from "@/lib/types";
import { toSides, sidesToCss, toDimension, dim } from "@/lib/types";
import { useEditorStore } from "@/lib/store/editorStore";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import {
  hasFixedTextHeight,
  textBoxToReactStyle,
  textInnerLayoutStyle,
  textTypographyToReactStyle,
} from "@/lib/export/textStyle";
import { cn } from "@/lib/utils";

export function TextBlock({
  block,
  compactWidth = false,
}: {
  block: TextBlockType;
  compactWidth?: boolean;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fixedHeight = hasFixedTextHeight(block.style);
  const isFillWidth = toDimension(block.style.width, dim(0, "fill")).unit === "fill";
  const useFullWidth = isFillWidth && !compactWidth;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: block.content.html,
    onUpdate: ({ editor }) => {
      updateBlock(block.id, {
        content: { html: editor.getHTML() },
      } as Partial<TextBlockType>);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content.html) {
      editor.commands.setContent(block.content.html, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.content.html]);

  return (
    <div
      style={{
        padding: sidesToCss(toSides(block.style.padding)),
        ...textBoxToReactStyle(block.style),
        ...(compactWidth && isFillWidth
          ? { width: "auto", alignSelf: "auto", maxWidth: "100%" }
          : {}),
        ...commonStyleToReactStyle(block.style),
      }}
      className={cn(useFullWidth && "w-full", fixedHeight && "min-h-0 flex-1")}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          ...textTypographyToReactStyle(block.style),
          ...textInnerLayoutStyle(block.style),
        }}
      >
        <EditorContent
          editor={editor}
          className={cn(fixedHeight && "text-block-editor")}
        />
      </div>
    </div>
  );
}
