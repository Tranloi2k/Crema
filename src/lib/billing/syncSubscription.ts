import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { handlePlanDowngrade, handlePlanUpgrade } from "@/lib/billing/downgrade";
import { planFromStripePriceId, type PlanId } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function findUserIdFromSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });
  return user?.id ?? null;
}

export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | null {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return null;
}

export async function syncActiveSubscription(subscription: Stripe.Subscription) {
  const userId = await findUserIdFromSubscription(subscription);
  if (!userId) return null;

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;

  const mapped = planFromStripePriceId(priceId);
  if (!mapped) return null;

  const periodEndRaw = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw * 1000) : null;

  await db
    .update(users)
    .set({
      plan: mapped.planId,
      planInterval: mapped.interval,
      planStatus: mapSubscriptionStatus(subscription.status),
      planCurrentPeriodEnd: periodEnd,
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(users.id, userId));

  await handlePlanUpgrade(userId, mapped.planId);
  return { userId, planId: mapped.planId, interval: mapped.interval };
}

export async function syncCanceledSubscription(subscription: Stripe.Subscription) {
  const userId = await findUserIdFromSubscription(subscription);
  if (!userId) return null;

  await db
    .update(users)
    .set({
      planStatus: "canceled",
      stripeSubscriptionId: null,
      planInterval: null,
      planCurrentPeriodEnd: null,
    })
    .where(eq(users.id, userId));

  await handlePlanDowngrade(userId, "free");
  return { userId, planId: "free" as PlanId };
}

/** Pull latest subscription state from Stripe (fallback when webhook was not delivered). */
export async function syncUserSubscriptionFromStripe(userId: string) {
  const stripe = getStripe();
  if (!stripe) return { synced: false as const, reason: "stripe_not_configured" };

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.stripeCustomerId) {
    return { synced: false as const, reason: "no_stripe_customer" };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  });

  const active = subscriptions.data.find(
    (s) => s.status === "active" || s.status === "trialing"
  );

  if (active) {
    const result = await syncActiveSubscription(active);
    if (!result) return { synced: false as const, reason: "mapping_failed" };
    return { synced: true as const, plan: result.planId, interval: result.interval };
  }

  if (user.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      if (sub.status === "canceled" || sub.status === "incomplete_expired") {
        await syncCanceledSubscription(sub);
        return { synced: true as const, plan: "free" as PlanId };
      }
    } catch {
      // subscription may have been removed in Stripe
    }
  }

  return { synced: false as const, reason: "no_active_subscription" };
}
