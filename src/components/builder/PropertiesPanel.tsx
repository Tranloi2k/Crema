"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store/editorStore";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LIST,
  type SocialPlatform,
} from "@/lib/social";
import { withCommonDefaults, dim, toDimension, toSides, toCorners, FONT_OPTIONS, FONT_WEIGHT_OPTIONS, TEXT_TRANSFORM_OPTIONS, TEXT_DECORATION_OPTIONS, FONT_STYLE_OPTIONS, TEXT_ALIGN_OPTIONS, TEXT_VERTICAL_ALIGN_OPTIONS } from "@/lib/types";
import type {
  Block,
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

function insertAtInputCursor(
  value: string,
  insert: string,
  input: HTMLInputElement | null
): string {
  const start = input?.selectionStart ?? value.length;
  const end = input?.selectionEnd ?? value.length;
  return value.slice(0, start) + insert + value.slice(end);
}

function NameSection({ block }: { block: Block }) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  return (
    <div className="border-b px-3 py-2.5">
      <Input
        value={block.name ?? ""}
        placeholder={block.type.charAt(0).toUpperCase() + block.type.slice(1)}
        onChange={(e) =>
          updateBlock(block.id, { name: e.target.value || undefined } as Partial<Block>)
        }
        className="h-8 text-sm font-semibold"
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
    updateBlock(block.id, { style: { ...block.style, ...partial } } as Partial<Block>);
  }

  return (
    <>
      <Section title="Position">
        <Row label="Type">
          <select
            value={style.position}
            onChange={(e) =>
              patchStyle({ position: e.target.value as CommonStyle["position"] })
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
              <UnitInput value={style.top} onChange={(top) => patchStyle({ top })} />
            </Row>
            <Row label="Left">
              <UnitInput value={style.left} onChange={(left) => patchStyle({ left })} />
            </Row>
            <Row label="Right">
              <UnitInput value={style.right} onChange={(right) => patchStyle({ right })} />
            </Row>
            <Row label="Bottom">
              <UnitInput value={style.bottom} onChange={(bottom) => patchStyle({ bottom })} />
            </Row>
          </>
        )}
      </Section>

      {showBackground && (
        <Section title="Background">
          <Row label="Color">
            <ColorField
              value={style.bgColor}
              onChange={(bgColor) => patchStyle({ bgColor })}
            />
          </Row>
        </Section>
      )}

      <Section title="Border">
        <Row label="Width">
          <Input
            type="number"
            value={style.border.width}
            onChange={(e) =>
              patchStyle({ border: { ...style.border, width: Number(e.target.value) } })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Radius" align="start">
          <CornersInput
            value={toCorners(style.border.radius)}
            onChange={(radius) =>
              patchStyle({ border: { ...style.border, radius: toCorners(radius) } })
            }
          />
        </Row>
        <Row label="Color">
          <ColorField
            value={style.border.color}
            onChange={(color) => patchStyle({ border: { ...style.border, color } })}
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
      </Section>
    </>
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
        <Row label="Variable">
          <MergeTagInsertMenu
            onInsert={(tag) => useEditorStore.getState().insertMergeTag(tag)}
          />
        </Row>
      </Section>
      <Section title="Typography">
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
            value={block.style.fontSize}
            onChange={(e) =>
              updateBlock(block.id, { style: { ...block.style, fontSize: Number(e.target.value) } })
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
                style: { ...block.style, lineHeight: Number(e.target.value) },
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
                style: { ...block.style, letterSpacing: Number(e.target.value) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Color">
          <ColorField
            value={block.style.color}
            onChange={(color) => updateBlock(block.id, { style: { ...block.style, color } })}
          />
        </Row>
        <Row label="Align H">
          <SelectInput
            value={block.style.align}
            options={TEXT_ALIGN_OPTIONS}
            onChange={(align) => updateBlock(block.id, { style: { ...block.style, align } })}
          />
        </Row>
        <Row label="Align V">
          <SelectInput
            value={block.style.verticalAlign ?? "top"}
            options={TEXT_VERTICAL_ALIGN_OPTIONS}
            onChange={(verticalAlign) =>
              updateBlock(block.id, { style: { ...block.style, verticalAlign } })
            }
          />
        </Row>
        <Row label="Transform">
          <SelectInput
            value={block.style.textTransform ?? "none"}
            options={TEXT_TRANSFORM_OPTIONS}
            onChange={(textTransform) =>
              updateBlock(block.id, { style: { ...block.style, textTransform } })
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
              updateBlock(block.id, { style: { ...block.style, textDecoration } })
            }
          />
        </Row>
      </Section>
      <Section title="Layout">
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, { style: { ...block.style, width: w, height: h } })
          }
        />
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
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
          <Input
            value={block.content.src}
            onChange={(e) =>
              updateBlock(block.id, { content: { ...block.content, src: e.target.value } })
            }
            placeholder="https://..."
            className="h-7 text-xs"
            disabled={readOnly}
          />
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
            {uploadError && <p className="text-[10px] text-destructive">{uploadError}</p>}
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
          <Input
            value={block.content.alt}
            onChange={(e) =>
              updateBlock(block.id, { content: { ...block.content, alt: e.target.value } })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Link">
          <Input
            value={block.content.href}
            onChange={(e) =>
              updateBlock(block.id, { content: { ...block.content, href: e.target.value } })
            }
            placeholder="Page or URL..."
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Size">
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, { style: { ...block.style, width: w, height: h } })
          }
        />
      </Section>
      <Section title="Layout">
        <Row label="Align">
          <AlignSelect
            value={block.style.align}
            onChange={(align) => updateBlock(block.id, { style: { ...block.style, align } })}
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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
                updateBlock(block.id, { content: { ...block.content, label: e.target.value } })
              }
              className="h-7 min-w-0 flex-1 text-xs"
            />
            <MergeTagInsertMenu
              onInsert={(tag) =>
                updateBlock(block.id, {
                  content: {
                    ...block.content,
                    label: insertAtInputCursor(block.content.label, tag, labelRef.current),
                  },
                })
              }
            />
          </div>
        </Row>
        <Row label="Link">
          <div className="flex w-full gap-1">
            <Input
              ref={hrefRef}
              value={block.content.href}
              onChange={(e) =>
                updateBlock(block.id, { content: { ...block.content, href: e.target.value } })
              }
              placeholder="Page or URL..."
              className="h-7 min-w-0 flex-1 text-xs"
            />
            <MergeTagInsertMenu
              onInsert={(tag) =>
                updateBlock(block.id, {
                  content: {
                    ...block.content,
                    href: insertAtInputCursor(block.content.href, tag, hrefRef.current),
                  },
                })
              }
            />
          </div>
        </Row>
      </Section>
      <Section title="Style">
        <Row label="Background">
          <ColorField
            value={block.style.bgColor}
            onChange={(bgColor) => updateBlock(block.id, { style: { ...block.style, bgColor } })}
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
            value={block.style.borderRadius}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, borderRadius: Number(e.target.value) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Size">
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, { style: { ...block.style, width: w, height: h } })
          }
        />
      </Section>
      <Section title="Layout">
        <Row label="Align">
          <AlignSelect
            value={block.style.align}
            onChange={(align) => updateBlock(block.id, { style: { ...block.style, align } })}
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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
      <Section title="Style">
        <Row label="Color">
          <ColorField
            value={block.style.color}
            onChange={(color) => updateBlock(block.id, { style: { ...block.style, color } })}
          />
        </Row>
        <Row label="Thickness">
          <Input
            type="number"
            value={block.style.thickness}
            onChange={(e) =>
              updateBlock(block.id, {
                style: { ...block.style, thickness: Number(e.target.value) },
              })
            }
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Layout">
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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
      <Section title="Size">
        <Row label="Height">
          <HeightUnitInput
            blockId={block.id}
            value={height}
            onChange={(h) => updateBlock(block.id, { style: { ...block.style, height: h } })}
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
      <Section title="Size">
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, { style: { ...block.style, width: w, height: h } })
          }
        />
      </Section>
      <Section title="Layout">
        <Row label="Direction">
          <OptionButtonGroup>
            {(["column", "row"] as const).map((d) => (
              <OptionButton
                key={d}
                selected={block.style.direction === d}
                onClick={() => updateBlock(block.id, { style: { ...block.style, direction: d } })}
                className="h-7 flex-1 capitalize"
              >
                {d}
              </OptionButton>
            ))}
          </OptionButtonGroup>
        </Row>
        <Row label="Distribute">
          <FlexJustifySelect
            value={block.style.justify ?? "start"}
            onChange={(justify) =>
              updateBlock(block.id, { style: { ...block.style, justify } })
            }
          />
        </Row>
        <Row label="Align">
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
            value={block.style.gap}
            onChange={(e) =>
              updateBlock(block.id, { style: { ...block.style, gap: Number(e.target.value) } })
            }
            className="h-7 text-xs"
          />
        </Row>
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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

  function changePlatform(platform: SocialPlatform) {
    // Swap the link to the new platform's default when the user hasn't set a
    // custom one (still on the previous platform's default, or empty).
    const prevDefault = SOCIAL_PLATFORMS[block.content.platform]?.defaultHref;
    const href =
      !block.content.href || block.content.href === prevDefault
        ? SOCIAL_PLATFORMS[platform].defaultHref
        : block.content.href;
    updateBlock(block.id, { content: { platform, href } });
  }

  return (
    <>
      <Section title="Content">
        <Row label="Platform">
          <select
            value={block.content.platform}
            onChange={(e) => changePlatform(e.target.value as SocialPlatform)}
            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
          >
            {SOCIAL_PLATFORM_LIST.map((p) => (
              <option key={p} value={p}>
                {SOCIAL_PLATFORMS[p].label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Link">
          <Input
            value={block.content.href}
            onChange={(e) =>
              updateBlock(block.id, { content: { ...block.content, href: e.target.value } })
            }
            placeholder="https://..."
            className="h-7 text-xs"
          />
        </Row>
      </Section>
      <Section title="Style">
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
            onChange={(align) => updateBlock(block.id, { style: { ...block.style, align } })}
          />
        </Row>
      </Section>
      <Section title="Size">
        <BlockSizeSection
          block={block}
          width={width}
          height={height}
          onSizeChange={(w, h) =>
            updateBlock(block.id, { style: { ...block.style, width: w, height: h } })
          }
        />
      </Section>
      <Section title="Layout">
        <Row label="Padding" align="start">
          <SidesInput
            value={padding}
            onChange={(p) => updateBlock(block.id, { style: { ...block.style, padding: p } })}
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
      <div className="p-4 text-sm text-muted-foreground">
        Select a block to edit its properties.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
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
