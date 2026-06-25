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

interface UsageSummary {
  plan: PlanId;
  planInterval: string | null;
  planStatus: string | null;
}

export function PricingSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setUsage(null);
      return;
    }
    fetch("/api/billing/usage")
      .then(async (res) => {
        const data = await parseJsonResponse<UsageSummary>(res);
        if (res.ok && data?.plan) {
          setUsage(data);
          if (data.planInterval === "annual" || data.planInterval === "monthly") {
            setInterval(data.planInterval);
          }
        }
      })
      .catch(() => setUsage(null));
  }, [session?.user]);

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
    if (isCurrentPlan(planId)) return;

    setLoading(planId);
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
      setLoading(null);
    }
  }

  function displayPrice(planId: PlanId) {
    const plan = PLANS[planId];
    if (planId === "free") return { main: "$0", sub: "forever" };
    if (interval === "monthly") {
      return { main: `$${plan.priceMonthly}`, sub: "/month" };
    }
    return {
      main: `$${plan.priceAnnualPerMonth}`,
      sub: `/mo billed $${plan.priceAnnualTotal}/year`,
    };
  }

  function planButtonLabel(planId: PlanId): string {
    if (isCurrentPlan(planId)) return "Current plan";
    if (planId === "free") {
      return session?.user ? "Go to dashboard" : "Get started";
    }
    if (usage && usage.plan !== "free" && usage.plan === planId) {
      return interval === "monthly" ? "Switch to monthly" : "Switch to annual";
    }
    return `Upgrade to ${PLANS[planId].name}`;
  }

  return (
    <section id="pricing" className="px-6 pb-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
          Start free. Upgrade when you need more templates and image uploads.
        </p>

        <div className="mt-8 inline-flex rounded-full border border-border/70 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              interval === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              interval === "annual" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            Annual
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const price = displayPrice(planId);
            const highlighted = planId === "pro";
            const current = isCurrentPlan(planId);

            return (
              <div
                key={planId}
                className={cn(
                  "flex flex-col rounded-2xl border p-6 text-left shadow-sm",
                  highlighted
                    ? "border-primary shadow-md shadow-primary/10"
                    : "border-border/70 bg-card",
                  current && "ring-2 ring-primary/30"
                )}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {current && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">{price.main}</span>
                    <span className="text-sm text-muted-foreground">{price.sub}</span>
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {FEATURES[planId].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                {planId === "free" ? (
                  current ? (
                    <Button className="w-full rounded-full" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full rounded-full"
                      variant={highlighted ? "default" : "outline"}
                    >
                      <Link href={session?.user ? "/dashboard" : "/signup"}>
                        {planButtonLabel(planId)}
                      </Link>
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full rounded-full"
                    variant={highlighted ? "default" : "outline"}
                    disabled={current || !!loading}
                    onClick={() => handlePaidPlan(planId)}
                  >
                    {loading === planId ? "Redirecting…" : planButtonLabel(planId)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
