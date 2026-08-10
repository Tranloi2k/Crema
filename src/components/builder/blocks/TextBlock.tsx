"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, Link2, List, ListOrdered, Strikethrough, Unlink } from "lucide-react";
import { useEffect } from "react";
import type { TextBlock as TextBlockType } from "@/lib/types";
import { toSides, sidesToCss, toDimension, dim } from "@/lib/types";
import { isFillHeight } from "@/lib/layout/dimensions";
import { useEditorStore } from "@/lib/store/editorStore";
import { commonStyleToReactStyle } from "@/lib/export/commonStyle";
import {
  hasFixedTextHeight,
  normalizeTextTypography,
  textBoxToReactStyle,
  textInnerLayoutStyle,
  textTypographyToCssVars,
} from "@/lib/export/textStyle";
import { MergeTagHighlight } from "@/lib/tiptap/mergeTagHighlight";
import { cn } from "@/lib/utils";

export function TextBlock({
  block,
  compactWidth = false,
  crossAxisFill = false,
}: {
  block: TextBlockType;
  compactWidth?: boolean;
  crossAxisFill?: boolean;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const registerTextEditor = useEditorStore((s) => s.registerTextEditor);
  const isSelected = selectedBlockId === block.id;
  const fixedHeight = hasFixedTextHeight(block.style);
  const verticalAlign = normalizeTextTypography(block.style).verticalAlign;
  const isFillWidth = toDimension(block.style.width, dim(0, "fill")).unit === "fill";
  const useFullWidth = isFillWidth && !compactWidth;
  const fitHeight = !fixedHeight;
  const fillHeight = isFillHeight(toDimension(block.style.height, dim(0, "fit-content")));

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

  function editLink() {
    if (!editor) return;
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", currentHref ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

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
        ...textBoxToReactStyle(block.style, { crossAxisFill }),
        ...(compactWidth && isFillWidth
          ? { width: "auto", alignSelf: "auto", maxWidth: "100%" }
          : {}),
        ...commonStyleToReactStyle(block.style),
        ...textTypographyToCssVars(block.style),
      }}
      className={cn(
        useFullWidth && "w-full min-w-0",
        fixedHeight && "min-h-0 min-w-0",
        fillHeight && crossAxisFill && "h-full self-stretch",
        fillHeight && !crossAxisFill && "flex-1",
        fitHeight && "h-fit self-start",
        "text-block-surface"
      )}
      data-vertical-align={verticalAlign}
      data-height-mode={fitHeight ? "fit" : "fixed"}
      data-cross-axis-fill={crossAxisFill && fillHeight ? "true" : undefined}
      onPointerDown={(e) => e.stopPropagation()}
      data-resize-target={block.id}
    >
      {isSelected && editor && (
        <div
          role="toolbar"
          aria-label="Text formatting"
          className="absolute bottom-full left-0 z-40 mb-1 flex items-center gap-0.5 rounded-lg border bg-background/95 p-1 text-muted-foreground shadow-lg backdrop-blur"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <select
            value={
              editor.isActive("heading", { level: 1 }) ? "1" :
              editor.isActive("heading", { level: 2 }) ? "2" :
              editor.isActive("heading", { level: 3 }) ? "3" : "paragraph"
            }
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
            }}
            className="h-7 rounded-md border border-input bg-background px-1.5 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Text style"
            title="Text style"
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
          <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
          {[
            { label: "Bold", active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run(), icon: Bold },
            { label: "Italic", active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run(), icon: Italic },
            { label: "Strikethrough", active: editor.isActive("strike"), action: () => editor.chain().focus().toggleStrike().run(), icon: Strikethrough },
            { label: "Bullet list", active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run(), icon: List },
            { label: "Numbered list", active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered },
          ].map(({ label, active, action, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              title={label}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={editLink}
            title="Add or edit link"
            aria-label="Add or edit link"
            aria-pressed={editor.isActive("link")}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              editor.isActive("link") && "bg-primary/10 text-primary",
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive("link")}
            title="Remove link"
            aria-label="Remove link"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div
        style={textInnerLayoutStyle(block.style)}
        className={cn(
          fixedHeight && "flex min-h-0 flex-1 flex-col",
          fitHeight && "contents"
        )}
      >
        <EditorContent
          editor={editor}
          className={cn(
            "text-block-editor-surface",
            fixedHeight && "text-block-editor",
            fitHeight && "contents"
          )}
        />
      </div>
    </div>
  );
}
