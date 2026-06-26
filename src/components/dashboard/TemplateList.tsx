"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/loader";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import type { PlanId } from "@/lib/billing/plans";
import type { StackBlock } from "@/lib/types";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

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
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/templates"), fetch("/api/billing/usage")])
      .then(async ([templatesRes, usageRes]) => {
        const templatesData = await parseJsonResponse<TemplateSummary[]>(templatesRes);
        const usageData = await parseJsonResponse<UsageSummary>(usageRes);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        if (usageRes.ok && usageData?.plan) setUsage(usageData);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxTemplates = usage?.limits.maxTemplates;
  const atLimit =
    maxTemplates != null && (usage?.templateCount ?? 0) >= maxTemplates;

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
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
      <div className="mb-8 flex items-center justify-between">
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
        </div>
        <Button
          onClick={handleCreate}
          disabled={creating || atLimit || usage?.downgradeSelectionPending}
          className="rounded-full"
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Template
        </Button>
      </div>

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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
