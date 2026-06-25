import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";
import { getPlanLimits, type PlanId } from "@/lib/billing/plans";

export async function getUserBilling(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const planId = (user.plan ?? "free") as PlanId;
  const limits = getPlanLimits(planId);

  const [countResult] = await db
    .select({ value: count() })
    .from(templates)
    .where(eq(templates.userId, userId));

  const templateRows = await db.query.templates.findMany({
    where: eq(templates.userId, userId),
    columns: { id: true, name: true, locked: true, updatedAt: true },
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  });

  return {
    plan: planId,
    planInterval: user.planInterval,
    planStatus: user.planStatus,
    planCurrentPeriodEnd: user.planCurrentPeriodEnd,
    hasSubscription: !!user.billingSubscriptionId && planId !== "free",
    downgradeSelectionPending: user.downgradeSelectionPending ?? false,
    limits,
    templateCount: countResult?.value ?? 0,
    templates: templateRows.map((t) => ({
      id: t.id,
      name: t.name,
      locked: t.locked ?? false,
      updatedAt: t.updatedAt,
    })),
  };
}
