"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId, type PlanInterval } from "@/lib/billing/plans";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import { cn } from "@/lib/utils";

type BillingInterval = PlanInterval;

const PLAN_ORDER: PlanId[] = ["free", "pro", "pro_plus"];

/** UI-only — does not block /api/billing/checkout. Set true when LS store is verified. */
const UPGRADE_COMING_SOON =
  process.env.NEXT_PUBLIC_BILLING_UPGRADE_ENABLED !== "true";

const FEATURES: Record<PlanId, string[]> = {
  free: ["Up to 3 templates", "Paste image URLs", "Export HTML"],
  pro: ["Up to 10 templates", "2 uploaded images per template", "Export HTML"],
  pro_plus: [
    "Unlimited templates",
    "5 uploaded images per template",
    "Export HTML",
    "Priority support",
  ],
};

export interface PricingUsageSummary {
  plan: PlanId;
  planInterval: string | null;
  planStatus: string | null;
}

interface PricingSectionProps {
  initialUsage?: PricingUsageSummary | null;
}

export function PricingSection({ initialUsage = null }: PricingSectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>(
    initialUsage?.planInterval === "annual" ? "annual" : "monthly"
  );
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [usage, setUsage] = useState<PricingUsageSummary | null>(initialUsage);

  const usageLoading = status === "loading" || (!!session?.user && usage === null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setUsage(null);
      return;
    }

    let cancelled = false;
    fetch("/api/billing/usage")
      .then(async (res) => {
        const data = await parseJsonResponse<PricingUsageSummary>(res);
        if (!cancelled && res.ok && data?.plan) {
          setUsage(data);
          if (data.planInterval === "annual" || data.planInterval === "monthly") {
            setInterval(data.planInterval);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setUsage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user, status]);

  function isCurrentPlan(planId: PlanId): boolean {
    if (!usage) return false;
    if (planId === "free") return usage.plan === "free";
    return usage.plan === planId && usage.planInterval === interval;
  }

  async function handlePaidPlan(planId: PlanId) {
    if (!session?.user) {
      router.push("/signup");
      return;
    }
    if (usageLoading || isCurrentPlan(planId)) return;

    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setCheckoutLoading(null);
    }
  }

  function displayPrice(planId: PlanId) {
    const plan = PLANS[planId];
    if (planId === "free") {
      return { main: "$0", suffix: "forever", annualNote: null };
    }
    if (interval === "monthly") {
      return {
        main: `$${plan.priceMonthly}`,
        suffix: "/month",
        annualNote: `Annual: $${plan.priceAnnualPerMonth}/mo`,
      };
    }
    return {
      main: `$${plan.priceAnnualPerMonth}`,
      suffix: "/mo",
      annualNote: `billed $${plan.priceAnnualTotal}/year`,
    };
  }

  function planButtonLabel(planId: PlanId): string {
    if (usageLoading && planId !== "free") return "Loading…";
    if (isCurrentPlan(planId)) return "Current plan";
    if (planId !== "free" && UPGRADE_COMING_SOON) return "Coming soon";
    if (planId === "free") {
      return session?.user ? "Go to dashboard" : "Get started";
    }
    if (usage && usage.plan !== "free" && usage.plan === planId) {
      return interval === "monthly" ? "Switch to monthly" : "Switch to annual";
    }
    return `Upgrade to ${PLANS[planId].name}`;
  }

  return (
    <section id="pricing" className="px-lg pb-section">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display text-display-md text-foreground">Simple pricing</h2>
        <p className="text-body-lg mx-auto mt-md max-w-lg text-muted-foreground">
          Start free. Upgrade when you need more templates and image uploads.
        </p>

        <div className="mt-xl inline-flex rounded-pill border border-border/70 bg-muted/40 p-xxs">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "text-button rounded-pill px-lg py-xs transition-colors",
              interval === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={cn(
              "text-button rounded-pill px-lg py-xs transition-colors",
              interval === "annual" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Annual
          </button>
        </div>

        <div className="mt-xl grid gap-md md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const price = displayPrice(planId);
            const highlighted = planId === "pro";
            const current = !usageLoading && isCurrentPlan(planId);
            const comingSoon = planId !== "free" && UPGRADE_COMING_SOON;
            const buttonDisabled =
              planId === "free"
                ? current
                : current || !!checkoutLoading || usageLoading || comingSoon;

            return (
              <div
                key={planId}
                className={cn(
                  "flex flex-col rounded-xl border bg-muted/40 p-lg text-left",
                  highlighted ? "border-primary" : "border-border/70"
                )}
              >
                <div>
                  <div className="flex items-center gap-xs">
                    <h3 className="text-headline text-foreground">{PLANS[planId].name}</h3>
                    {current && (
                      <span className="text-caption rounded-pill bg-muted px-xs py-xxs text-muted-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-md flex flex-wrap items-baseline gap-x-xs gap-y-xxs">
                    <span className="font-display text-display-md text-foreground">{price.main}</span>
                    <span className="text-body-sm text-muted-foreground">
                      {price.suffix}
                      {price.annualNote && (
                        <>
                          {" "}
                          <span className="text-muted-foreground">{price.annualNote}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="my-lg border-t border-border/70" />

                <ul className="mb-xl flex-1 space-y-sm">
                  {FEATURES[planId].map((f) => (
                    <li key={f} className="text-body flex items-start gap-sm text-foreground/80">
                      <Check className="mt-xxs h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                {planId === "free" ? (
                  current ? (
                    <button
                      type="button"
                      className="text-button w-full rounded-pill border border-border bg-background px-lg py-sm text-foreground"
                      disabled
                    >
                      Current plan
                    </button>
                  ) : (
                    <Button
                      asChild
                      className="text-button h-auto w-full rounded-pill border border-border bg-background px-lg py-sm text-foreground shadow-none hover:bg-muted/60"
                      variant="outline"
                    >
                      <Link href={session?.user ? "/dashboard" : "/signup"}>
                        {planButtonLabel(planId)}
                      </Link>
                    </Button>
                  )
                ) : current ? (
                  <button
                    type="button"
                    className="text-button w-full rounded-pill bg-primary px-lg py-sm text-primary-foreground"
                    disabled
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "text-button w-full rounded-pill border px-lg py-sm transition-colors",
                      comingSoon
                        ? "cursor-not-allowed border-border bg-background text-muted-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted/60",
                      checkoutLoading === planId && "opacity-70"
                    )}
                    disabled={buttonDisabled}
                    onClick={() => handlePaidPlan(planId)}
                  >
                    {checkoutLoading === planId ? "Redirecting…" : planButtonLabel(planId)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
