import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireUserId } from "@/lib/billing/requireUser";
import { getStripe } from "@/lib/billing/stripe";
import { isPlanId, stripePriceId, type PlanId, type PlanInterval } from "@/lib/billing/plans";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "";
  const interval = body.interval === "annual" ? "annual" : "monthly";

  if (!isPlanId(planId) || planId === "free") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const priceId = stripePriceId(planId as PlanId, interval as PlanInterval);
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured for this plan." }, { status: 503 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.email) {
    return NextResponse.json({ error: "User email is required for checkout." }, { status: 400 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?success=1`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
    metadata: { userId, planId, interval },
    subscription_data: {
      metadata: { userId, planId, interval },
    },
  });

  return NextResponse.json({ url: session.url });
}
