import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/billing/requireUser";
import { syncUserSubscriptionFromStripe } from "@/lib/billing/syncSubscription";
import { getUserBilling } from "@/lib/billing/getUserBilling";

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sync = await syncUserSubscriptionFromStripe(userId);
    const billing = await getUserBilling(userId);

    return NextResponse.json({
      ...sync,
      billing,
    });
  } catch (err) {
    console.error("POST /api/billing/sync", err);
    return NextResponse.json({ error: "Failed to sync subscription." }, { status: 500 });
  }
}
