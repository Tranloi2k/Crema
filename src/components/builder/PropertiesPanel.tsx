"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, MousePointerClick, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store/editorStore";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LIST,
  getSocialItems,
  type SocialItem,
  type SocialPlatform,
} from "@/lib/social";
import {
  withCommonDefaults,
  dim,
  toDimension,
  toSides,
  toCorners,
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_TRANSFORM_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  FONT_STYLE_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_VERTICAL_ALIGN_OPTIONS,
} from "@/lib/types";
import type {
  Block,
  BlockType,
  CommonStyle,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  StackBlock,
  SocialBlock,
} from "@/lib/types";
import {
  Section,
  Row,
  ColorField,
  UnitInput,
  HeightUnitInput,
  BlockSizeSection,
  SidesInput,
  CornersInput,
  SelectInput,
  FontFamilySelect,
  AlignSelect,
  FlexAlignSelect,
  FlexJustifySelect,
  OptionButton,
  OptionButtonGroup,
} from "@/components/builder/properties/fields";
import { MergeTagInsertMenu } from "@/components/builder/VariablesPanel";

const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  stack: "Layout",
  social: "Social icon",
};

function insertAtInputCursor(
  value: string,
  insert: string,
  input: HTMLInputElement | null,
): string {
  const start = input?.selectionStart ?? value.length;
  const end = input?.selectionEnd ?? value.length;
  return value.slice(0, start) + insert + value.slice(end);
}

function clampNumber(raw: string, min: number, max: number, fallback = min) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function urlError(
  value: string,
  { required = false, image = false }: { required?: boolean; image?: boolean } = {},
) {
  const trimmed = value.trim();
  if (!trimmed) return required ? "This field is required." : null;
  if (/\{\{[\s\S]+\}\}/.test(trimmed)) return null;
  if (image) {
    return /^https?:\/\//i.test(trimmed) ? null : "Use a full http:// or https:// image URL.";
  }
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)
    ? null
    : "Use a full URL such as https://example.com.";
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 flex items-start gap-1 text-[10px] leading-4 text-destructive">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function NameSection({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  return (
    <div className="border-b px-3 py-2.5">
      <Input
        value={block.name ?? ""}
        placeholder={BLOCK_LABELS[block.type]}
        onChange={(e) =>
          updateBlock(block.id, {
            name: e.target.value || undefined,
          } as Partial<Block>)
        }
        className="h-8 text-sm font-semibold"
        aria-label="Block name"
      />
    </div>
  );
}

function CommonStyleSections({
  block,
  showBackground = true,
}: {
  block: Block;
  showBackground?: boolean;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const style = withCommonDefaults(block.style as Partial<CommonStyle>);

  function patchStyle(partial: Partial<CommonStyle>) {
    updateBlock(block.id, {
      style: { ...block.style, ...partial },
    } as Partial<Block>);
  }

  return (
    <Section title="Advanced styles" defaultOpen={false}>
      <div className="space-y-2 border-b pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Position</p>
        <Row label="Type">
          <select
            value={style.position}
            onChange={(e) =>
              patchStyle({
                position: e.target.value as CommonStyle["position"],
              })
            }
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs capitalize"
          >
            <option value="static">Static</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
          </select>
        </Row>
        {style.position !== "static" && (
          <>
            <Row label="Top">
              <UnitInput
                value={style.top}
                onChange={(top) => patchStyle({ top })}
              />
            </Row>
            <Row label="Left">
              <UnitInput
                value={style.left}
                onChange={(left) => patchStyle({ left })}
              />
            </Row>
            <Row label="Right">
              <UnitInput
                value={style.right}
                onChange={(right) => patchStyle({ right })}
              />
            </Row>
            <Row label="Bottom">
              <UnitInput
                value={style.bottom}
                onChange={(bottom) => patchStyle({ bottom })}
              />
            </Row>
          </>
        )}
      </div>

      {showBackground && (
        <div className="space-y-2 border-b py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Background</p>
          <Row label="Color">
            <ColorField
              value={style.bgColor}
              onChange={(bgColor) => patchStyle({ bgColor })}
            />
          </Row>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Border</p>
        <Row label="Width">
          <Input
            type="number"
            min={0}
            max={50}
            value={style.border.width}
            onChange={(e) =>
              patchStyle({
                border: { ...style.border, width: clampNumber(e.target.value, 0, 50) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Radius" align="start">
          <CornersInput
            value={toCorners(style.border.radius)}
            onChange={(radius) =>
              patchStyle({
                border: { ...style.border, radius: toCorners(radius) },
              })
            }
          />
        </Row>
        <Row label="Color">
          <ColorField
            value={style.border.color}
            onChange={(color) =>
              patchStyle({ border: { ...style.border, color } })
            }
          />
        </Row>
        <Row label="Style">
          <select
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs capitalize"
            value={style.border.style}
            onChange={(e) =>
              patchStyle({
                border: {
                  ...style.border,
                  style: e.target.value as CommonStyle["border"]["style"],
                },
              })
            }
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </Row>
      </div>
    </Section>
  );
}

function TextProperties({ block }: { block: TextBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const padding = toSides(block.style.padding);
  const width = toDimension(block.style.width, dim(0, "fill"));
  const height = toDimension(block.style.height, dim(0, "fit-content"));

  return (
    <>
      <Section title="Content">
        <Row label="Personalize">
          <MergeTagInsertMenu
            onInsert={(tag) => useEditorStore.getState().insertMergeTag(tag)}
          />
        </Row>
      </Section>
      <Section title="Typography" defaultOpen={false}>
        <Row label="Font">
          <FontFamilySelect
            value={block.style.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) =>
              updateBlock(block.id, { style: { ...block.style, fontFamily } })
            }
          />
        </Row>
        <Row label="Weight">
          <SelectInput
            value={block.style.fontWeight ?? 400}
            options={FONT_WEIGHT_OPTIONS}
            onChange={(fontWeight) =>
              updateBlock(block.id, { style: { ...block.style, fontWeight } })
            }
          />
        </Row>
        <Row label="Size">
          <Input
            type="number"
            min={8}
            max={200}
            value={block.style.fontSize}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, fontSize: clampNumber(e.target.value, 8, 200, 16) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Line H">
          <Input
            type="number"
            min={0.5}
            max={5}
            step={0.1}
            value={block.style.lineHeight ?? 1.5}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, lineHeight: clampNumber(e.target.value, 0.5, 5, 1.5) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Letter">
          <Input
            type="number"
            step={0.5}
            value={block.style.letterSpacing ?? 0}
            onChange={(e) =>
              updateBlock(block.id, {
                style: {
                  ...block.style,
                  letterSpacing: Number(e.target.value),
                },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Color">
          <ColorField
            value={block.style.color}
            onChange={(color) =>
              updateBlock(block.id, { style: { ...block.style, color } })
            }
          />
        </Row>
        <Row label="Align H">
          <SelectInput
            value={block.style.align}
            options={TEXT_ALIGN_OPTIONS}
            onChange={(align) =>
              updateBlock(block.id, { style: { ...block.style, align } })
            }
          />
        </Row>
        <Row label="Align V">
          <SelectInput
            value={block.style.verticalAlign ?? "top"}
            options={TEXT_VERTICAL_ALIGN_OPTIONS}
            onChange={(verticalAlign) =>
              updateBlock(block.id, {
                style: { ...block.style, verticalAlign },
              })
            }
          />
        </Row>
        <Row label="Transform">
          <SelectInput
            value={block.style.textTransform ?? "none"}
            options={TEXT_TRANSFORM_OPTIONS}
            onChange={(textTransform) =>
              updateBlock(block.id, {
                style: { ...block.style, textTransform },
              })
            }
          />
        </Row>
        <Row label="Style">
          <SelectInput
            value={block.style.fontStyle ?? "normal"}
            options={FONT_STYLE_OPTIONS}
            onChange={(fontStyle) =>
              updateBlock(block.id, { style: { ...block.style, fontStyle } })
            }
          />
        </Row>
        <Row label="Decor">
          <SelectInput
            value={block.style.textDecoration ?? "none"}
            options={TEXT_DECORATION_OPTIONS}
            onChange={(textDecoration) =>
              updateBlock(block.id, {
                style: { ...block.style, textDecoration },
              })
            }
          />
        </Row>
      </Section>
      <Section title="Layout" defaultOpen={false}>
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, {
              style: { ...block.style, width: w, height: h },
            })
          }
        />
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

function ImageProperties({
  block,
  templateId,
  canUpload,
  readOnly = false,
}: {
  block: ImageBlock;
  templateId: string;
  canUpload: boolean;
  readOnly?: boolean;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const padding = toSides(block.style.padding);
  const width = toDimension(block.style.width, dim(560));
  const height = toDimension(block.style.height, dim(0, "fit-content"));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", templateId);
      if (block.content.src) {
        formData.append("previousUrl", block.content.src);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      if (data.url) {
        updateBlock(block.id, { content: { ...block.content, src: data.url } });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <Section title="Content">
        <Row label="Source">
          <div className="w-full">
            <Input
              value={block.content.src}
              onChange={(e) =>
                updateBlock(block.id, {
                  content: { ...block.content, src: e.target.value },
                })
              }
              placeholder="https://..."
              className="h-7 text-xs"
              disabled={readOnly}
              aria-label="Image source URL"
              aria-invalid={!!urlError(block.content.src, { required: true, image: true })}
            />
            <FieldError message={urlError(block.content.src, { required: true, image: true })} />
          </div>
        </Row>
        {canUpload && !readOnly && (
          <Row label="Upload">
            <div className="flex w-full flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-7 w-full text-xs"
              >
                {uploading ? "Uploading..." : "Choose file"}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                Uploads to Cloudinary — works in Outlook
              </p>
              {uploadError && (
                <p className="text-[10px] text-destructive">{uploadError}</p>
              )}
            </div>
          </Row>
        )}
        {!canUpload && !readOnly && (
          <p className="px-3 pb-2 text-[10px] text-muted-foreground">
            Image upload requires Pro. Paste an image URL above, or{" "}
            <Link href="/#pricing" className="text-primary hover:underline">
              upgrade your plan
            </Link>
            .
          </p>
        )}
        <Row label="Alt">
          <div className="w-full">
            <Input
              value={block.content.alt}
              onChange={(e) =>
                updateBlock(block.id, {
                  content: { ...block.content, alt: e.target.value },
                })
              }
              placeholder="Describe the image"
              className="h-7 text-xs"
              aria-label="Image alternative text"
            />
            {!block.content.alt.trim() && (
              <p className="mt-1 text-[10px] leading-4 text-amber-700 dark:text-amber-300">
                Add alt text for accessibility.
              </p>
            )}
          </div>
        </Row>
        <Row label="Link">
          <div className="w-full">
            <Input
              value={block.content.href}
              onChange={(e) =>
                updateBlock(block.id, {
                  content: { ...block.content, href: e.target.value },
                })
              }
              placeholder="Optional destination URL"
              className="h-7 text-xs"
              aria-label="Image destination URL"
              aria-invalid={!!urlError(block.content.href)}
            />
            <FieldError message={urlError(block.content.href)} />
          </div>
        </Row>
        {!urlError(block.content.href, { required: true }) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full gap-2 text-xs"
            onClick={() => window.open(block.content.href, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Test image link
          </Button>
        )}
      </Section>
      <Section title="Size" defaultOpen={false}>
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, {
              style: { ...block.style, width: w, height: h },
            })
          }
        />
      </Section>
      <Section title="Layout" defaultOpen={false}>
        <Row label="Align">
          <AlignSelect
            value={block.style.align}
            onChange={(align) =>
              updateBlock(block.id, { style: { ...block.style, align } })
            }
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

function ButtonProperties({ block }: { block: ButtonBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const labelRef = useRef<HTMLInputElement>(null);
  const hrefRef = useRef<HTMLInputElement>(null);
  const padding = toSides(block.style.padding);
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const height = toDimension(block.style.height, dim(0, "fit-content"));
  return (
    <>
      <Section title="Content">
        <Row label="Label">
          <div className="flex w-full gap-1">
            <Input
              ref={labelRef}
              value={block.content.label}
              onChange={(e) =>
                updateBlock(block.id, {
                  content: { ...block.content, label: e.target.value },
                })
              }
              className="h-7 min-w-0 flex-1 text-xs"
              aria-label="Button label"
              aria-invalid={!block.content.label.trim()}
            />
            <MergeTagInsertMenu
              onInsert={(tag) =>
                updateBlock(block.id, {
                  content: {
                    ...block.content,
                    label: insertAtInputCursor(
                      block.content.label,
                      tag,
                      labelRef.current,
                    ),
                  },
                })
              }
            />
          </div>
          {!block.content.label.trim() && <FieldError message="Add text for the button." />}
        </Row>
        <Row label="Link">
          <div className="w-full">
            <div className="flex w-full gap-1">
              <Input
                ref={hrefRef}
                value={block.content.href}
                onChange={(e) =>
                  updateBlock(block.id, {
                    content: { ...block.content, href: e.target.value },
                  })
                }
                placeholder="https://example.com"
                className="h-7 min-w-0 flex-1 text-xs"
                aria-label="Button destination URL"
                aria-invalid={!!urlError(block.content.href, { required: true })}
              />
              <MergeTagInsertMenu
                onInsert={(tag) =>
                  updateBlock(block.id, {
                    content: {
                      ...block.content,
                      href: insertAtInputCursor(
                        block.content.href,
                        tag,
                        hrefRef.current,
                      ),
                    },
                  })
                }
              />
            </div>
            <FieldError message={urlError(block.content.href, { required: true })} />
          </div>
        </Row>
        {!urlError(block.content.href, { required: true }) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full gap-2 text-xs"
            onClick={() => window.open(block.content.href, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Test button link
          </Button>
        )}
      </Section>
      <Section title="Appearance">
        <Row label="Background">
          <ColorField
            value={block.style.bgColor}
            onChange={(bgColor) =>
              updateBlock(block.id, { style: { ...block.style, bgColor } })
            }
          />
        </Row>
        <Row label="Text color">
          <ColorField
            value={block.style.textColor}
            onChange={(textColor) =>
              updateBlock(block.id, { style: { ...block.style, textColor } })
            }
          />
        </Row>
        <Row label="Radius" align="start">
          <Input
            type="number"
            min={0}
            max={999}
            value={block.style.borderRadius}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, borderRadius: clampNumber(e.target.value, 0, 999) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Size" defaultOpen={false}>
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, {
              style: { ...block.style, width: w, height: h },
            })
          }
        />
      </Section>
      <Section title="Layout" defaultOpen={false}>
        <Row label="Align">
          <AlignSelect
            value={block.style.align}
            onChange={(align) =>
              updateBlock(block.id, { style: { ...block.style, align } })
            }
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      {/* showBackground=false: button uses its own style.bgColor already. */}
      <CommonStyleSections block={block} showBackground={false} />
    </>
  );
}

function DividerProperties({ block }: { block: DividerBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const padding = toSides(block.style.padding);
  return (
    <>
      <Section title="Line appearance">
        <Row label="Color">
          <ColorField
            value={block.style.color}
            onChange={(color) =>
              updateBlock(block.id, { style: { ...block.style, color } })
            }
          />
        </Row>
        <Row label="Thickness">
          <Input
            type="number"
            min={1}
            max={20}
            value={block.style.thickness}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, thickness: clampNumber(e.target.value, 1, 20, 1) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Line type">
          <select
            value={block.style.lineStyle ?? "solid"}
            onChange={(event) =>
              updateBlock(block.id, {
                style: {
                  ...block.style,
                  lineStyle: event.target.value as DividerBlock["style"]["lineStyle"],
                },
              })
            }
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </Row>
      </Section>
      <Section title="Spacing" defaultOpen={false}>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

function SpacerProperties({ block }: { block: SpacerBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const height = toDimension(block.style.height, dim(24));
  return (
    <>
      <Section title="Space size">
        <Row label="Quick size">
          <OptionButtonGroup className="grid grid-cols-3">
            {[8, 16, 24, 40, 64].map((size) => (
              <OptionButton
                key={size}
                selected={height.unit === "px" && height.value === size}
                onClick={() =>
                  updateBlock(block.id, { style: { ...block.style, height: dim(size) } })
                }
                className="h-7"
              >
                {size}px
              </OptionButton>
            ))}
          </OptionButtonGroup>
        </Row>
        <Row label="Height">
          <HeightUnitInput
            blockId={block.id}
            value={height}
            onChange={(h) =>
              updateBlock(block.id, { style: { ...block.style, height: h } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

function StackProperties({ block }: { block: StackBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const padding = toSides(block.style.padding);
  const width = toDimension(block.style.width, dim(0, "fit-content"));
  const height = toDimension(block.style.height, dim(0, "fit-content"));
  return (
    <>
      <Section title="Size" defaultOpen={false}>
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, {
              style: { ...block.style, width: w, height: h },
            })
          }
        />
      </Section>
      <Section title="Arrange content">
        <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">
          Choose whether items appear top-to-bottom or side-by-side.
        </p>
        <Row label="Flow">
          <OptionButtonGroup>
            {(["column", "row"] as const).map((d) => (
              <OptionButton
                key={d}
                selected={block.style.direction === d}
                onClick={() =>
                  updateBlock(block.id, {
                    style: { ...block.style, direction: d },
                  })
                }
                className="h-7 flex-1"
              >
                {d === "column" ? "Vertical" : "Horizontal"}
              </OptionButton>
            ))}
          </OptionButtonGroup>
        </Row>
        <Row label="Along flow">
          <FlexJustifySelect
            value={block.style.justify ?? "start"}
            onChange={(justify) =>
              updateBlock(block.id, { style: { ...block.style, justify } })
            }
          />
        </Row>
        <Row label="Across flow">
          <FlexAlignSelect
            value={block.style.align ?? "start"}
            onChange={(align) =>
              updateBlock(block.id, { style: { ...block.style, align } })
            }
          />
        </Row>
        <Row label="Gap">
          <Input
            type="number"
            min={0}
            max={200}
            value={block.style.gap}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, gap: clampNumber(e.target.value, 0, 200) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

function SocialProperties({ block }: { block: SocialBlock }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const padding = toSides(block.style.padding);
  const width = toDimension(block.style.width, dim(32));
  const height = toDimension(block.style.height, dim(32));
  const items = getSocialItems(block.content);
  const unusedPlatforms = SOCIAL_PLATFORM_LIST.filter(
    (platform) => !items.some((item) => item.platform === platform),
  );

  function setItems(nextItems: SocialItem[]) {
    updateBlock(block.id, { content: { items: nextItems } });
  }

  function patchItem(index: number, partial: Partial<SocialItem>) {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...partial } : item));
  }

  function changePlatform(index: number, platform: SocialPlatform) {
    const current = items[index];
    const previousDefault = SOCIAL_PLATFORMS[current.platform].defaultHref;
    patchItem(index, {
      platform,
      href: !current.href || current.href === previousDefault
        ? SOCIAL_PLATFORMS[platform].defaultHref
        : current.href,
    });
  }

  function addNetwork() {
    const platform = unusedPlatforms[0];
    if (!platform) return;
    setItems([...items, { platform, href: SOCIAL_PLATFORMS[platform].defaultHref }]);
  }

  return (
    <>
      <Section title="Content">
        <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">
          Manage the complete social icon group in one place.
        </p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${item.platform}-${index}`} className="rounded-lg border bg-muted/20 p-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={item.platform}
                  onChange={(event) => changePlatform(index, event.target.value as SocialPlatform)}
                  aria-label={`Network ${index + 1}`}
                  className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {SOCIAL_PLATFORM_LIST.filter(
                    (platform) => platform === item.platform || !items.some((entry) => entry.platform === platform),
                  ).map((platform) => (
                    <option key={platform} value={platform}>{SOCIAL_PLATFORMS[platform].label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={items.length === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                  aria-label={`Remove ${SOCIAL_PLATFORMS[item.platform].label}`}
                  title="Remove network"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={item.href}
                onChange={(event) => patchItem(index, { href: event.target.value })}
                placeholder="https://..."
                className="mt-1.5 h-8 text-xs"
                aria-label={`${SOCIAL_PLATFORMS[item.platform].label} profile URL`}
                aria-invalid={!!urlError(item.href, { required: true })}
              />
              <FieldError message={urlError(item.href, { required: true })} />
            </div>
          ))}
          {items.length === 0 && (
            <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              Add a network to show social links.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-2 text-xs"
          onClick={addNetwork}
          disabled={unusedPlatforms.length === 0}
        >
          <Plus className="h-3.5 w-3.5" />
          {unusedPlatforms.length === 0 ? "All networks added" : "Add network"}
        </Button>
      </Section>
      <Section title="Appearance" defaultOpen={false}>
        <Row label="Color">
          <ColorField
            value={block.style.iconColor}
            onChange={(iconColor) =>
              updateBlock(block.id, { style: { ...block.style, iconColor } })
            }
          />
        </Row>
        <Row label="Align">
          <AlignSelect
            value={block.style.align}
            onChange={(align) =>
              updateBlock(block.id, { style: { ...block.style, align } })
            }
          />
        </Row>
        <Row label="Icon gap">
          <Input
            type="number"
            min={0}
            max={64}
            value={block.style.gap ?? 8}
            onChange={(event) =>
              updateBlock(block.id, {
                style: { ...block.style, gap: clampNumber(event.target.value, 0, 64, 8) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Icon size" defaultOpen={false}>
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, {
              style: { ...block.style, width: w, height: h },
            })
          }
        />
      </Section>
      <Section title="Spacing" defaultOpen={false}>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) =>
              updateBlock(block.id, { style: { ...block.style, padding: p } })
            }
          />
        </Row>
      </Section>
      <CommonStyleSections block={block} />
    </>
  );
}

export function PropertiesPanel({
  block,
  templateId = "",
  canUpload = false,
  readOnly = false,
}: {
  block: Block | null;
  templateId?: string;
  canUpload?: boolean;
  readOnly?: boolean;
}) {
  if (!block) {
    return (
      <div className="flex min-h-full flex-col">
        <div data-tour="properties" className="flex h-[73px] items-center gap-2 border-b px-4">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">Properties</h2>
            <p className="text-[11px] text-muted-foreground">Style and content controls</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-foreground">Select a block</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Click any block on the canvas to edit its content, layout, and style.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div data-tour="properties" className="flex h-[73px] shrink-0 items-center gap-2 border-b px-4">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <div>
          <h2 className="text-sm font-semibold">Properties</h2>
          <p className="text-[11px] text-muted-foreground">Editing {BLOCK_LABELS[block.type]}</p>
        </div>
      </div>
      <NameSection block={block} />
      {block.type === "text" && <TextProperties block={block} />}
      {block.type === "image" && (
        <ImageProperties
          block={block}
          templateId={templateId}
          canUpload={canUpload}
          readOnly={readOnly}
        />
      )}
      {block.type === "button" && <ButtonProperties block={block} />}
      {block.type === "divider" && <DividerProperties block={block} />}
      {block.type === "spacer" && <SpacerProperties block={block} />}
      {block.type === "stack" && <StackProperties block={block} />}
      {block.type === "social" && <SocialProperties block={block} />}
    </div>
  );
}
