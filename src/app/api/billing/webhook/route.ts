import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";
import {
  findUserIdFromSubscription,
  mapSubscriptionStatus,
  syncActiveSubscription,
  syncCanceledSubscription,
} from "@/lib/billing/syncSubscription";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${String(err)}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await syncActiveSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === "active" || subscription.status === "trialing") {
        await syncActiveSubscription(subscription);
      } else if (
        subscription.status === "canceled" ||
        subscription.status === "incomplete_expired"
      ) {
        await syncCanceledSubscription(subscription);
      } else {
        const userId = await findUserIdFromSubscription(subscription);
        if (userId) {
          await db
            .update(users)
            .set({ planStatus: mapSubscriptionStatus(subscription.status) })
            .where(eq(users.id, userId));
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncCanceledSubscription(subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
