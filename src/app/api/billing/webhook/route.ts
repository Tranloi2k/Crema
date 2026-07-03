import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import type { LemonSubscription } from "@/lib/billing/lemonSqueezy";
import { getSubscription } from "@/lib/billing/lemonSqueezy";
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
  data?: LemonSubscription | LemonSubscriptionInvoice;
}

interface LemonSubscriptionInvoice {
  type: string;
  id: string;
  attributes: {
    subscription_id: number;
    status: string;
  };
}

function isSubscription(data: unknown): data is LemonSubscription {
  return !!data && typeof data === "object" && (data as LemonSubscription).type === "subscriptions";
}

function isSubscriptionInvoice(data: unknown): data is LemonSubscriptionInvoice {
  return (
    !!data &&
    typeof data === "object" &&
    (data as LemonSubscriptionInvoice).type === "subscription-invoices"
  );
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
  const data = payload.data;
  const customData = payload.meta?.custom_data;

  try {
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_cancelled":
        if (isSubscription(data)) {
          await processLemonSubscription(data, customData);
        }
        break;
      case "subscription_payment_success":
      case "subscription_payment_recovered":
        if (isSubscriptionInvoice(data)) {
          const subscription = await getSubscription(String(data.attributes.subscription_id));
          await processLemonSubscription(subscription, customData);
        } else if (isSubscription(data)) {
          await processLemonSubscription(data, customData);
        }
        break;
      case "subscription_expired":
        if (isSubscription(data)) {
          await syncCanceledLemonSubscription(data, customData);
        }
        break;
      case "subscription_payment_failed": {
        const userId =
          typeof customData?.user_id === "string"
            ? customData.user_id
            : null;
        if (isSubscriptionInvoice(data)) {
          const subscription = await getSubscription(String(data.attributes.subscription_id));
          if (userId) {
            await db
              .update(users)
              .set({ planStatus: mapLemonSubscriptionStatus(subscription.attributes.status) })
              .where(eq(users.id, userId));
          } else {
            await processLemonSubscription(subscription, customData);
          }
        } else if (userId && isSubscription(data)) {
          await db
            .update(users)
            .set({ planStatus: mapLemonSubscriptionStatus(data.attributes.status) })
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
