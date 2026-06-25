import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";
import { getPlanLimits, type PlanId } from "@/lib/billing/plans";

export async function unlockAllTemplates(userId: string) {
  await db.update(templates).set({ locked: false }).where(eq(templates.userId, userId));
}

export async function handlePlanUpgrade(userId: string, planId: PlanId) {
  await db
    .update(users)
    .set({
      plan: planId,
      downgradeSelectionPending: false,
    })
    .where(eq(users.id, userId));

  await unlockAllTemplates(userId);
}

export async function handlePlanDowngrade(userId: string, newPlanId: PlanId) {
  const limits = getPlanLimits(newPlanId);

  const [countResult] = await db
    .select({ value: count() })
    .from(templates)
    .where(eq(templates.userId, userId));

  const templateCount = countResult?.value ?? 0;
  const maxTemplates = limits.maxTemplates;

  if (maxTemplates !== null && templateCount > maxTemplates) {
    await db
      .update(users)
      .set({
        plan: newPlanId,
        downgradeSelectionPending: true,
      })
      .where(eq(users.id, userId));
    return;
  }

  await db
    .update(users)
    .set({
      plan: newPlanId,
      downgradeSelectionPending: false,
    })
    .where(eq(users.id, userId));

  await unlockAllTemplates(userId);
}
