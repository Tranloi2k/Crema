import { eq } from "drizzle-orm";

import { handlePlanDowngrade, handlePlanUpgrade } from "@/lib/billing/downgrade";
import {
  getSubscription,
  listSubscriptionsByCustomer,
  type LemonSubscription,
} from "@/lib/billing/lemonSqueezy";
import { isLemonSqueezyConfigured } from "@/lib/billing/lemonSqueezy";
import { planFromLemonVariantId, planRank, type PlanId } from "@/lib/billing/plans";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

function customUserId(customData: unknown): string | null {
  if (!customData || typeof customData !== "object") return null;
  const record = customData as Record<string, unknown>;
  const userId = record.user_id ?? record.userId;
  return typeof userId === "string" ? userId : null;
}

export async function findUserIdFromLemonSubscription(
  subscription: LemonSubscription,
  webhookCustomData?: unknown
): Promise<string | null> {
  const fromWebhook = customUserId(webhookCustomData);
  if (fromWebhook) return fromWebhook;

  const customerId = String(subscription.attributes.customer_id);
  const user = await db.query.users.findFirst({
    where: eq(users.billingCustomerId, customerId),
  });
  return user?.id ?? null;
}

export function isLemonSubscriptionEntitled(subscription: LemonSubscription): boolean {
  const { status, ends_at } = subscription.attributes;
  if (status === "active" || status === "on_trial" || status === "past_due" || status === "paused") {
    return true;
  }
  if (status === "unpaid") return true;
  if (status === "cancelled" && ends_at) {
    return new Date(ends_at) > new Date();
  }
  return false;
}

export function mapLemonSubscriptionStatus(
  status: string
): "active" | "canceled" | "cancelled" | "past_due" | null {
  if (status === "active" || status === "on_trial" || status === "paused") return "active";
  if (status === "cancelled") return "cancelled";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "expired") return "canceled";
  return null;
}

function subscriptionPeriodEnd(subscription: LemonSubscription): Date | null {
  const { renews_at, ends_at, status } = subscription.attributes;
  const raw = status === "cancelled" ? (ends_at ?? renews_at) : (renews_at ?? ends_at);
  return raw ? new Date(raw) : null;
}

/** When a customer has multiple subscriptions (e.g. Pro checkout then Pro+ upgrade), pick the highest tier. */
export function pickBestEntitledSubscription(
  subscriptions: LemonSubscription[]
): LemonSubscription | null {
  const entitled = subscriptions.filter(isLemonSubscriptionEntitled);
  if (entitled.length === 0) return null;

  return entitled.reduce((best, current) => {
    const bestMapped = planFromLemonVariantId(best.attributes.variant_id);
    const currentMapped = planFromLemonVariantId(current.attributes.variant_id);
    const bestRank = bestMapped ? planRank(bestMapped.planId) : -1;
    const currentRank = currentMapped ? planRank(currentMapped.planId) : -1;
    if (currentRank !== bestRank) {
      return currentRank > bestRank ? current : best;
    }

    const bestRenew = best.attributes.renews_at
      ? new Date(best.attributes.renews_at).getTime()
      : 0;
    const currentRenew = current.attributes.renews_at
      ? new Date(current.attributes.renews_at).getTime()
      : 0;
    return currentRenew > bestRenew ? current : best;
  });
}

async function listUserSubscriptions(user: {
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
}): Promise<LemonSubscription[]> {
  if (user.billingCustomerId) {
    return listSubscriptionsByCustomer(user.billingCustomerId);
  }

  if (user.billingSubscriptionId) {
    try {
      return [await getSubscription(user.billingSubscriptionId)];
    } catch {
      return [];
    }
  }

  return [];
}

export async function syncActiveLemonSubscription(
  subscription: LemonSubscription,
  webhookCustomData?: unknown
) {
  const userId = await findUserIdFromLemonSubscription(subscription, webhookCustomData);
  if (!userId) return null;

  const mapped = planFromLemonVariantId(subscription.attributes.variant_id);
  if (!mapped) {
    console.error(
      "syncActiveLemonSubscription: unknown variant_id",
      subscription.attributes.variant_id,
      "subscription",
      subscription.id
    );
    return null;
  }

  const customerId = String(subscription.attributes.customer_id);

  await db
    .update(users)
    .set({
      plan: mapped.planId,
      planInterval: mapped.interval,
      planStatus: mapLemonSubscriptionStatus(subscription.attributes.status),
      planCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
      billingCustomerId: customerId,
      billingSubscriptionId: subscription.id,
    })
    .where(eq(users.id, userId));

  await handlePlanUpgrade(userId, mapped.planId);
  return { userId, planId: mapped.planId, interval: mapped.interval };
}

export async function syncCanceledLemonSubscription(
  subscription: LemonSubscription,
  webhookCustomData?: unknown
) {
  const userId = await findUserIdFromLemonSubscription(subscription, webhookCustomData);
  if (!userId) return null;

  await db
    .update(users)
    .set({
      planStatus: "canceled",
      billingSubscriptionId: null,
      planInterval: null,
      planCurrentPeriodEnd: null,
    })
    .where(eq(users.id, userId));

  await handlePlanDowngrade(userId, "free");
  return { userId, planId: "free" as PlanId };
}

export async function processLemonSubscription(
  subscription: LemonSubscription,
  webhookCustomData?: unknown
) {
  if (isLemonSubscriptionEntitled(subscription)) {
    return syncActiveLemonSubscription(subscription, webhookCustomData);
  }
  return syncCanceledLemonSubscription(subscription, webhookCustomData);
}

/** Pull latest subscription state from Lemon Squeezy (fallback when webhook was not delivered). */
export async function syncUserSubscription(userId: string) {
  if (!isLemonSqueezyConfigured()) {
    return { synced: false as const, reason: "lemon_squeezy_not_configured" };
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return { synced: false as const, reason: "user_not_found" };
  }

  const subscriptions = await listUserSubscriptions(user);

  const entitled = pickBestEntitledSubscription(subscriptions);
  if (entitled) {
    const result = await syncActiveLemonSubscription(entitled);
    if (!result) return { synced: false as const, reason: "mapping_failed" };
    return { synced: true as const, plan: result.planId, interval: result.interval };
  }

  const latest = subscriptions[0];
  if (latest && !isLemonSubscriptionEntitled(latest)) {
    await syncCanceledLemonSubscription(latest);
    return { synced: true as const, plan: "free" as PlanId };
  }

  return { synced: false as const, reason: "no_active_subscription" };
}
