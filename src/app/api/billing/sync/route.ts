import { NextResponse } from "next/server";

import { getUserBilling } from "@/lib/billing/getUserBilling";
import { requireUserId } from "@/lib/billing/requireUser";
import { syncUserSubscription } from "@/lib/billing/syncSubscription";
import { isDatabaseConnectionError } from "@/lib/db/client";

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sync = await syncUserSubscription(userId);
    const billing = await getUserBilling(userId);

    return NextResponse.json({
      ...sync,
      billing,
    });
  } catch (err) {
    console.error("POST /api/billing/sync", err);
    if (isDatabaseConnectionError(err)) {
      return NextResponse.json(
        {
          error:
            "Could not reach the database. Check your network connection and Turso settings, then try again.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to sync subscription." }, { status: 500 });
  }
}
