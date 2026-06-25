import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import type { LemonSubscription } from "@/lib/billing/lemonSqueezy";
import {
  mapLemonSubscriptionStatus,
  processLemonSubscription,
  syncCanceledLemonSubscription,
} from "@/lib/billing/syncSubscription";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: LemonSubscription;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), "hex");
  const sig = Buffer.from(signature, "hex");
  if (hmac.length !== sig.length) return false;
  return crypto.timingSafeEqual(hmac, sig);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature") ?? "";
  if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const subscription = payload.data;
  const customData = payload.meta?.custom_data;

  if (!subscription || subscription.type !== "subscriptions") {
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_payment_success":
        await processLemonSubscription(subscription, customData);
        break;
      case "subscription_cancelled":
        await processLemonSubscription(subscription, customData);
        break;
      case "subscription_expired":
        await syncCanceledLemonSubscription(subscription, customData);
        break;
      case "subscription_payment_failed": {
        const userId =
          typeof customData?.user_id === "string"
            ? customData.user_id
            : null;
        if (userId) {
          await db
            .update(users)
            .set({ planStatus: mapLemonSubscriptionStatus(subscription.attributes.status) })
            .where(eq(users.id, userId));
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("POST /api/billing/webhook", eventName, err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
