"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { parseJsonResponse } from "@/lib/parseJsonResponse";

interface UsageData {
  plan: PlanId;
  planInterval: string | null;
  planStatus: string | null;
  planCurrentPeriodEnd: number | null;
  hasSubscription: boolean;
  templateCount: number;
  limits: {
    maxTemplates: number | null;
    maxImagesPerTemplate: number;
    support: boolean;
  };
}

async function loadUsage(): Promise<UsageData | null> {
  const res = await fetch("/api/billing/usage");
  const data = await parseJsonResponse<UsageData>(res);
  return res.ok && data?.plan ? data : null;
}

export default function BillingPageClient() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const returningFromCheckout = searchParams.get("success") === "1";

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (returningFromCheckout) {
        setSyncing(true);
        setSyncMessage("Activating your subscription…");
        try {
          const syncRes = await fetch("/api/billing/sync", { method: "POST" });
          const syncData = await parseJsonResponse<{
            synced?: boolean;
            billing?: UsageData;
            reason?: string;
          }>(syncRes);

          if (!cancelled && syncRes.ok && syncData?.billing?.plan) {
            setUsage(syncData.billing);
            if (syncData.synced && syncData.billing.plan !== "free") {
              setSyncMessage(null);
            } else if (!syncData.synced) {
              setSyncMessage(
                "Payment received. If your plan does not update, refresh in a moment or check your Lemon Squeezy webhook."
              );
            }
          }
        } catch {
          if (!cancelled) {
            setSyncMessage("Could not confirm subscription yet. Try refreshing the page.");
          }
        } finally {
          if (!cancelled) setSyncing(false);
        }
      }

      if (!cancelled) {
        const data = await loadUsage();
        if (!cancelled && data) setUsage(data);
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [returningFromCheckout]);

  async function handleCancel() {
    if (
      !window.confirm(
        "Cancel your subscription? You will keep access until the end of the current billing period."
      )
    ) {
      return;
    }

    setCancelLoading(true);
    setCancelMessage(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await parseJsonResponse<{
        billing?: UsageData;
        endsAt?: string;
        error?: string;
      }>(res);

      if (!res.ok || !data) {
        setCancelMessage(data?.error ?? "Could not cancel subscription.");
        return;
      }

      if (data.billing) setUsage(data.billing);
      if (data.endsAt) {
        setCancelMessage(
          `Subscription canceled. Access continues until ${new Date(data.endsAt).toLocaleDateString()}.`
        );
      } else {
        setCancelMessage("Subscription canceled.");
      }
    } catch {
      setCancelMessage("Could not cancel subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const plan = usage?.plan ?? "free";
  const planInfo = PLANS[plan];
  const isCanceled = usage?.planStatus === "cancelled";
  const templateLimit = usage?.limits.maxTemplates;
  const templateLabel =
    templateLimit == null
      ? `${usage?.templateCount ?? 0} templates (unlimited)`
      : `${usage?.templateCount ?? 0} / ${templateLimit} templates`;

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      {returningFromCheckout && !syncing && !syncMessage && usage && usage.plan !== "free" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Subscription updated successfully.
        </div>
      )}

      {syncing && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {syncMessage ?? "Activating your subscription…"}
        </div>
      )}

      {!syncing && syncMessage && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {syncMessage}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your plan and usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-2xl font-semibold">{planInfo.name}</p>
            {usage?.planInterval && (
              <p className="text-sm capitalize text-muted-foreground">{usage.planInterval} billing</p>
            )}
            {usage?.planCurrentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {isCanceled ? "Access until" : "Renews"}{" "}
                {new Date(usage.planCurrentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {isCanceled && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your subscription is set to cancel at the end of this period.
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
            <p>{templateLabel}</p>
            <p>
              Image uploads:{" "}
              {(usage?.limits.maxImagesPerTemplate ?? 0) === 0
                ? "URL paste only (no uploads)"
                : `up to ${usage?.limits.maxImagesPerTemplate} per template`}
            </p>
            {usage?.limits.support && (
              <p>
                Priority support:{" "}
                <a href="mailto:support@crema.app" className="text-primary hover:underline">
                  support@crema.app
                </a>
              </p>
            )}
          </div>

          {cancelMessage && (
            <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {cancelMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {plan !== "free" && usage?.hasSubscription && !isCanceled && (
              <Button
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={cancelLoading}
                onClick={handleCancel}
              >
                {cancelLoading ? "Canceling…" : "Cancel subscription"}
              </Button>
            )}
            <Button asChild className="rounded-full">
              <Link href="/#pricing">{plan === "free" ? "Upgrade plan" : "Change plan"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
