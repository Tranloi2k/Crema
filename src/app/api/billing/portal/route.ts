import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getSubscription, isLemonSqueezyConfigured } from "@/lib/billing/lemonSqueezy";
import { requireUserId } from "@/lib/billing/requireUser";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLemonSqueezyConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.billingSubscriptionId) {
    return NextResponse.json({ error: "No subscription found." }, { status: 400 });
  }

  try {
    const subscription = await getSubscription(user.billingSubscriptionId);
    const url = subscription.attributes.urls.customer_portal;
    if (!url) {
      return NextResponse.json({ error: "Customer portal unavailable." }, { status: 503 });
    }
    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/billing/portal", err);
    return NextResponse.json({ error: "Failed to open customer portal." }, { status: 500 });
  }
}
