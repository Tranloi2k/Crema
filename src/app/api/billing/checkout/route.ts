import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { createCheckout, isLemonSqueezyConfigured } from "@/lib/billing/lemonSqueezy";
import { isValidEmail, normalizeEmail } from "@/lib/auth/password";
import { requireUserId } from "@/lib/billing/requireUser";
import { isPlanId, lemonVariantId, type PlanId, type PlanInterval } from "@/lib/billing/plans";
import { getAppBaseUrl } from "@/lib/appUrl";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLemonSqueezyConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "";
  const interval = body.interval === "annual" ? "annual" : "monthly";

  if (!isPlanId(planId) || planId === "free") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const variantId = lemonVariantId(planId as PlanId, interval as PlanInterval);
  if (!variantId) {
    return NextResponse.json({ error: "Variant not configured for this plan." }, { status: 503 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.email || !isValidEmail(user.email)) {
    return NextResponse.json(
      {
        error:
          "A valid email address is required for checkout. Sign in with a real account or update your profile email.",
      },
      { status: 400 }
    );
  }

  const email = normalizeEmail(user.email);

  const alreadyOnPlan =
    user.plan === planId &&
    user.planInterval === interval &&
    !!user.billingSubscriptionId &&
    user.planStatus !== "cancelled" &&
    user.planStatus !== "canceled";

  if (alreadyOnPlan) {
    return NextResponse.json({ error: "You are already on this plan." }, { status: 400 });
  }

  const baseUrl = getAppBaseUrl();

  try {
    const url = await createCheckout({
      variantId,
      email,
      name: user.name,
      userId,
      planId,
      interval,
      redirectUrl: `${baseUrl}/dashboard/billing?success=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("POST /api/billing/checkout", err);
    return NextResponse.json({ error: "Failed to create checkout." }, { status: 500 });
  }
}
