import { eq } from "drizzle-orm";

import { isValidEmail, normalizeEmail } from "@/lib/auth/password";
import { handlePlanDowngrade, handlePlanUpgrade } from "@/lib/billing/downgrade";
import {
  cancelSubscription,
  getCustomer,
  getSubscription,
  listSubscriptionsByCustomer,
  listSubscriptionsByEmail,
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
  if (user) return user.id;

  try {
    const customer = await getCustomer(customerId);
    const customerEmail = normalizeEmail(customer.attributes.email);
    const userByEmail = await db.query.users.findFirst({
      where: eq(users.email, customerEmail),
    });
    if (userByEmail) return userByEmail.id;
  } catch (err) {
    console.error("findUserIdFromLemonSubscription: failed to resolve customer", customerId, err);
  }

  return null;
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

function pickNewestByRenewsAt(subscriptions: LemonSubscription[]): LemonSubscription {
  return subscriptions.reduce((best, current) => {
    const bestRenew = best.attributes.renews_at
      ? new Date(best.attributes.renews_at).getTime()
      : 0;
    const currentRenew = current.attributes.renews_at
      ? new Date(current.attributes.renews_at).getTime()
      : 0;
    return currentRenew > bestRenew ? current : best;
  });
}

/** Pick the subscription to keep — prefers checkout plan on downgrade, else highest tier. */
export function pickBestEntitledSubscription(
  subscriptions: LemonSubscription[],
  preferredPlanId?: PlanId
): LemonSubscription | null {
  const entitled = subscriptions.filter(isLemonSubscriptionEntitled);
  if (entitled.length === 0) return null;

  if (preferredPlanId) {
    const matching = entitled.filter((sub) => {
      const mapped = planFromLemonVariantId(sub.attributes.variant_id);
      return mapped?.planId === preferredPlanId;
    });
    if (matching.length > 0) {
      return pickNewestByRenewsAt(matching);
    }
  }

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

async function listUserSubscriptions(
  user: {
    billingCustomerId: string | null;
    billingSubscriptionId: string | null;
    email: string | null;
  },
  extraEmails: string[] = []
): Promise<LemonSubscription[]> {
  const subscriptions: LemonSubscription[] = [];
  const seenIds = new Set<string>();

  const addSubs = (subs: LemonSubscription[]) => {
    for (const sub of subs) {
      if (!seenIds.has(sub.id)) {
        seenIds.add(sub.id);
        subscriptions.push(sub);
      }
    }
  };

  const emails = new Set<string>();
  if (user.email && isValidEmail(user.email)) {
    emails.add(normalizeEmail(user.email));
  }
  for (const email of extraEmails) {
    if (isValidEmail(email)) {
      emails.add(normalizeEmail(email));
    }
  }

  for (const email of emails) {
    addSubs(await listSubscriptionsByEmail(email));
  }

  if (user.billingCustomerId) {
    addSubs(await listSubscriptionsByCustomer(user.billingCustomerId));
  }

  if (subscriptions.length === 0 && user.billingSubscriptionId) {
    try {
      addSubs([await getSubscription(user.billingSubscriptionId)]);
    } catch {
      // ignore missing subscription
    }
  }

  return subscriptions;
}

/** Cancel duplicate active subscriptions after upgrade/downgrade checkout. */
async function cancelOtherEntitledSubscriptions(
  primary: LemonSubscription,
  allSubscriptions: LemonSubscription[]
) {
  const others = allSubscriptions.filter(
    (sub) => sub.id !== primary.id && isLemonSubscriptionEntitled(sub)
  );

  for (const sub of others) {
    try {
      await cancelSubscription(sub.id);
    } catch (err) {
      console.error("cancelOtherEntitledSubscriptions: failed to cancel", sub.id, err);
    }
  }
}

export async function syncActiveLemonSubscription(
  subscription: LemonSubscription,
  webhookCustomData?: unknown,
  options?: { allSubscriptions?: LemonSubscription[] }
) {
  const userId = await findUserIdFromLemonSubscription(subscription, webhookCustomData);
  if (!userId) {
    console.error(
      "syncActiveLemonSubscription: could not resolve user",
      "subscription",
      subscription.id,
      "customer",
      subscription.attributes.customer_id
    );
    return null;
  }

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

  const userRecord = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const previousPlan = (userRecord?.plan ?? "free") as PlanId;

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

  if (planRank(mapped.planId) < planRank(previousPlan)) {
    await handlePlanDowngrade(userId, mapped.planId);
  } else {
    await handlePlanUpgrade(userId, mapped.planId);
  }

  const allSubscriptions =
    options?.allSubscriptions ??
    (userRecord ? await listUserSubscriptions(userRecord, []) : [subscription]);

  await cancelOtherEntitledSubscriptions(subscription, allSubscriptions);

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
    const userId = await findUserIdFromLemonSubscription(subscription, webhookCustomData);
    let allSubscriptions: LemonSubscription[] | undefined;

    if (userId) {
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (user) {
        allSubscriptions = await listUserSubscriptions(user, []);
        if (!allSubscriptions.some((sub) => sub.id === subscription.id)) {
          allSubscriptions.push(subscription);
        }
      }
    }

    return syncActiveLemonSubscription(subscription, webhookCustomData, {
      allSubscriptions,
    });
  }
  return syncCanceledLemonSubscription(subscription, webhookCustomData);
}

type SyncUserSubscriptionOptions = {
  lemonEmail?: string;
  planId?: PlanId;
};

/** Pull latest subscription state from Lemon Squeezy (fallback when webhook was not delivered). */
export async function syncUserSubscription(
  userId: string,
  options?: SyncUserSubscriptionOptions
) {
  if (!isLemonSqueezyConfigured()) {
    return { synced: false as const, reason: "lemon_squeezy_not_configured" };
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return { synced: false as const, reason: "user_not_found" };
  }

  const extraEmails = options?.lemonEmail ? [options.lemonEmail] : [];
  const subscriptions = await listUserSubscriptions(user, extraEmails);
  const preferredPlanId = options?.planId ?? undefined;

  const entitled = pickBestEntitledSubscription(subscriptions, preferredPlanId);
  if (entitled) {
    const result = await syncActiveLemonSubscription(entitled, undefined, {
      allSubscriptions: subscriptions,
    });
    if (!result) return { synced: false as const, reason: "mapping_failed" };
    return { synced: true as const, plan: result.planId, interval: result.interval };
  }

  const latest = subscriptions[0];
  if (latest && !isLemonSubscriptionEntitled(latest)) {
    await syncCanceledLemonSubscription(latest);
    return { synced: true as const, plan: "free" as PlanId };
  }

  if (options?.lemonEmail) {
    return { synced: false as const, reason: "no_subscription_for_email" };
  }

  return {
    synced: false as const,
    reason: "no_active_subscription",
    hint: "email_mismatch",
  };
}
