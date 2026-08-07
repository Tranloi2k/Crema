"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loader";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { NewTemplateModal } from "@/components/dashboard/NewTemplateModal";
import type { PlanId } from "@/lib/billing/plans";
import type { StackBlock } from "@/lib/types";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import { createRootBlock } from "@/lib/defaultBlocks";
import { getPresetTemplate } from "@/lib/emails/presetTemplates";
import {
  createGuestDraftId,
  deleteGuestDraft,
  readGuestDrafts,
  saveGuestDraft,
  GUEST_STORAGE_UNAVAILABLE_MESSAGE,
  type GuestDraft,
} from "@/lib/guestDrafts";

interface TemplateSummary {
  id: string;
  name: string;
  content: StackBlock;
  updatedAt: number;
  locked?: boolean;
}

interface UsageSummary {
  plan: PlanId;
  templateCount: number;
  limits: { maxTemplates: number | null };
  downgradeSelectionPending: boolean;
}

export function TemplateList() {
  const router = useRouter();
  const { status } = useSession();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [guestDrafts, setGuestDrafts] = useState<GuestDraft[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setGuestDrafts(readGuestDrafts());
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetch("/api/templates"), fetch("/api/billing/usage")])
      .then(async ([templatesRes, usageRes]) => {
        const templatesData = await parseJsonResponse<TemplateSummary[]>(templatesRes);
        const usageData = await parseJsonResponse<UsageSummary>(usageRes);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        if (usageRes.ok && usageData?.plan) setUsage(usageData);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const maxTemplates = usage?.limits.maxTemplates;
  const atLimit =
    maxTemplates != null && (usage?.templateCount ?? 0) >= maxTemplates;

  async function handleCreate(preset: string) {
    if (status === "unauthenticated") {
      const selectedPreset = preset ? getPresetTemplate(preset) : undefined;
      const draft: GuestDraft = {
        id: createGuestDraftId(),
        name: selectedPreset?.templateName ?? "Untitled template",
        root: selectedPreset?.build() ?? createRootBlock(),
        updatedAt: Date.now(),
      };
      if (!saveGuestDraft(draft)) {
        setError(GUEST_STORAGE_UNAVAILABLE_MESSAGE);
        return;
      }
      router.push(`/editor/${draft.id}`);
      return;
    }
    if (status !== "authenticated") return;

    setCreating(true);
    setError(null);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset ? { preset } : {}),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreating(false);
      setModalOpen(false);
      setError(data.error ?? "Could not create template.");
      return;
    }
    if (data.id) router.push(`/editor/${data.id}`);
  }

  const usageLabel =
    maxTemplates === null
      ? `${usage?.templateCount ?? 0} templates`
      : `${usage?.templateCount ?? 0} / ${maxTemplates} templates`;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          {usage && (
            <p className="mt-1 text-sm text-muted-foreground">
              {usageLabel} · {usage.plan === "free" ? "Free" : usage.plan === "pro" ? "Pro" : "Pro+"}{" "}
              plan ·{" "}
              <Link href="/dashboard/billing" className="text-primary hover:underline">
                Manage billing
              </Link>
            </p>
          )}
          {status === "unauthenticated" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Drafts are stored only on this device.
            </p>
          )}
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          disabled={creating || atLimit || usage?.downgradeSelectionPending}
          className="rounded-full"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Template
        </Button>
      </div>

      <NewTemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={handleCreate}
        creating={creating}
      />

      {status === "unauthenticated" && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sign in to sync your templates</p>
            <p className="text-sm text-muted-foreground">
              Keep your work available across devices and save it to your account.
            </p>
          </div>
          <Button asChild className="shrink-0 rounded-full">
            <Link href={`/login?callbackUrl=${encodeURIComponent("/dashboard")}`}>Sign in</Link>
          </Button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}{" "}
          {error.includes("limit") && (
            <Link href="/#pricing" className="font-medium underline">
              Upgrade
            </Link>
          )}
        </p>
      )}

      {atLimit && (
        <p className="mb-4 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Template limit reached.{" "}
          <Link href="/#pricing" className="text-primary hover:underline">
            Upgrade your plan
          </Link>{" "}
          to create more.
        </p>
      )}

      {loading || status === "loading" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : status === "unauthenticated" ? (
        guestDrafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No local drafts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a template to start designing without an account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guestDrafts.map((draft) => (
              <article key={draft.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                <h2 className="truncate font-medium">{draft.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(draft.updatedAt).toLocaleString()}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/editor/${draft.id}`}>Open</Link>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    title="Delete local draft"
                    aria-label={`Delete ${draft.name}`}
                    onClick={() => {
                      deleteGuestDraft(draft.id);
                      setGuestDrafts((current) => current.filter((item) => item.id !== draft.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              content={t.content}
              updatedAt={t.updatedAt}
              locked={t.locked}
              duplicateDisabled={atLimit || usage?.downgradeSelectionPending}
              onDeleted={(id) => {
                setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
                setUsage((prev) =>
                  prev ? { ...prev, templateCount: Math.max(0, prev.templateCount - 1) } : prev
                );
              }}
              onDuplicated={(template) => {
                setTemplates((prev) => [template as TemplateSummary, ...prev]);
                setUsage((prev) =>
                  prev ? { ...prev, templateCount: prev.templateCount + 1 } : prev
                );
                setError(null);
              }}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
