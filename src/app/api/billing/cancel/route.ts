import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { cancelSubscription, isLemonSqueezyConfigured } from "@/lib/billing/lemonSqueezy";
import { getUserBilling } from "@/lib/billing/getUserBilling";
import { requireUserId } from "@/lib/billing/requireUser";
import { processLemonSubscription } from "@/lib/billing/syncSubscription";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isLemonSqueezyConfigured()) {
      return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.billingSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
    }

    if (user.planStatus === "cancelled" || user.planStatus === "canceled") {
      return NextResponse.json({ error: "Subscription is already canceled." }, { status: 400 });
    }

    const subscription = await cancelSubscription(user.billingSubscriptionId);
    await processLemonSubscription(subscription);

    const billing = await getUserBilling(userId);

    return NextResponse.json({
      success: true,
      endsAt: subscription.attributes.ends_at,
      billing,
    });
  } catch (err) {
    console.error("POST /api/billing/cancel", err);
    return NextResponse.json({ error: "Failed to cancel subscription." }, { status: 500 });
  }
}
