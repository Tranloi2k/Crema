import { NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "@/lib/auth/password";
import { getUserBilling } from "@/lib/billing/getUserBilling";
import { isPlanId, type PlanId } from "@/lib/billing/plans";
import { requireUserId } from "@/lib/billing/requireUser";
import { syncUserSubscription } from "@/lib/billing/syncSubscription";
import { isDatabaseConnectionError } from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const lemonEmail =
      typeof body.lemonEmail === "string" && isValidEmail(body.lemonEmail)
        ? normalizeEmail(body.lemonEmail)
        : undefined;
    const planId =
      typeof body.planId === "string" && isPlanId(body.planId)
        ? (body.planId as PlanId)
        : undefined;

    const sync = await syncUserSubscription(userId, { lemonEmail, planId });
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
