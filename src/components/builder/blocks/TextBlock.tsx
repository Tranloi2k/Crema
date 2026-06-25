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
import { MergeTagHighlight } from "@/lib/tiptap/mergeTagHighlight";
import { cn } from "@/lib/utils";

export function TextBlock({
  block,
  compactWidth = false,
}: {
  block: TextBlockType;
  compactWidth?: boolean;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const registerTextEditor = useEditorStore((s) => s.registerTextEditor);
  const isSelected = selectedBlockId === block.id;
  const fixedHeight = hasFixedTextHeight(block.style);
  const isFillWidth = toDimension(block.style.width, dim(0, "fill")).unit === "fill";
  const useFullWidth = isFillWidth && !compactWidth;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["paragraph"] }),
      MergeTagHighlight,
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

  useEffect(() => {
    if (!editor || !isSelected) return;
    registerTextEditor({
      insertAtCursor: (text) => {
        editor.chain().focus().insertContent(text).run();
      },
      focus: () => {
        editor.commands.focus();
      },
    });
    return () => registerTextEditor(null);
  }, [editor, isSelected, registerTextEditor]);

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
      className={cn(
        useFullWidth && "w-full",
        fixedHeight && "min-h-0 flex-1",
        "text-block-surface"
      )}
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
