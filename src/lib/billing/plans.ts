export type PlanId = "free" | "pro" | "pro_plus";
export type PlanInterval = "monthly" | "annual";

export interface PlanLimits {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnualPerMonth: number;
  priceAnnualTotal: number;
  maxTemplates: number | null;
  maxImagesPerTemplate: number;
  support: boolean;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnualPerMonth: 0,
    priceAnnualTotal: 0,
    maxTemplates: 3,
    maxImagesPerTemplate: 0,
    support: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 5,
    priceAnnualPerMonth: 3,
    priceAnnualTotal: 36,
    maxTemplates: 10,
    maxImagesPerTemplate: 2,
    support: false,
  },
  pro_plus: {
    id: "pro_plus",
    name: "Pro+",
    priceMonthly: 6,
    priceAnnualPerMonth: 4,
    priceAnnualTotal: 48,
    maxTemplates: null,
    maxImagesPerTemplate: 5,
    support: true,
  },
};

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro" || value === "pro_plus";
}

export function getPlanLimits(planId: string): PlanLimits {
  if (isPlanId(planId)) return PLANS[planId];
  return PLANS.free;
}

export function planRank(planId: PlanId): number {
  const ranks: Record<PlanId, number> = { free: 0, pro: 1, pro_plus: 2 };
  return ranks[planId];
}

/** Monthly vs annual savings for paid plans. */
export function annualSavings(planId: PlanId) {
  if (planId === "free") return null;
  const plan = PLANS[planId];
  const monthlyYearly = plan.priceMonthly * 12;
  const saved = monthlyYearly - plan.priceAnnualTotal;
  if (saved <= 0) return null;
  return {
    saved,
    percent: Math.round((saved / monthlyYearly) * 100),
    annualPerMonth: plan.priceAnnualPerMonth,
    annualTotal: plan.priceAnnualTotal,
  };
}

export function lemonVariantId(planId: PlanId, interval: PlanInterval): string | null {
  if (planId === "free") return null;
  const envKey =
    planId === "pro"
      ? interval === "monthly"
        ? "LEMONSQUEEZY_VARIANT_PRO_MONTHLY"
        : "LEMONSQUEEZY_VARIANT_PRO_ANNUAL"
      : interval === "monthly"
        ? "LEMONSQUEEZY_VARIANT_PRO_PLUS_MONTHLY"
        : "LEMONSQUEEZY_VARIANT_PRO_PLUS_ANNUAL";
  return process.env[envKey] ?? null;
}

export function planFromLemonVariantId(
  variantId: string | number
): { planId: PlanId; interval: PlanInterval } | null {
  const id = String(variantId);
  const mapping: [string | undefined, PlanId, PlanInterval][] = [
    [process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY, "pro", "monthly"],
    [process.env.LEMONSQUEEZY_VARIANT_PRO_ANNUAL, "pro", "annual"],
    [process.env.LEMONSQUEEZY_VARIANT_PRO_PLUS_MONTHLY, "pro_plus", "monthly"],
    [process.env.LEMONSQUEEZY_VARIANT_PRO_PLUS_ANNUAL, "pro_plus", "annual"],
  ];
  for (const [envVariant, planId, interval] of mapping) {
    if (envVariant && envVariant === id) return { planId, interval };
  }
  return null;
}
