import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { MERGE_TAG_REGEX } from "@/lib/mergeTags/patterns";

const mergeTagHighlightKey = new PluginKey("mergeTagHighlight");

export const MergeTagHighlight = Extension.create({
  name: "mergeTagHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: mergeTagHighlightKey,
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const re = new RegExp(MERGE_TAG_REGEX.source, "g");

            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              let match: RegExpExecArray | null;
              while ((match = re.exec(node.text)) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;
                decorations.push(
                  Decoration.inline(from, to, {
                    class: "merge-tag-chip",
                    nodeName: "span",
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
