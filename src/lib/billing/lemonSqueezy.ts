const LEMONSQUEEZY_API = "https://api.lemonsqueezy.com/v1";

export interface LemonSubscriptionAttributes {
  customer_id: number;
  variant_id: number;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  urls: {
    customer_portal: string | null;
    update_payment_method: string | null;
  };
  test_mode: boolean;
}

export interface LemonSubscription {
  type: string;
  id: string;
  attributes: LemonSubscriptionAttributes;
}

export interface LemonCustomer {
  type: string;
  id: string;
  attributes: {
    email: string;
    name: string;
  };
}

interface LemonApiResponse<T> {
  data: T;
}

interface LemonApiListResponse<T> {
  data: T[];
}

function apiKey(): string | null {
  return process.env.LEMONSQUEEZY_API_KEY ?? null;
}

export function isLemonSqueezyConfigured(): boolean {
  return !!(apiKey() && process.env.LEMONSQUEEZY_STORE_ID);
}

export function lemonStoreId(): string | null {
  return process.env.LEMONSQUEEZY_STORE_ID ?? null;
}

async function lemonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new Error("Lemon Squeezy is not configured.");
  }

  const res = await fetch(`${LEMONSQUEEZY_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${key}`,
      ...init?.headers,
    },
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const detail =
      json && typeof json === "object" && "errors" in json
        ? JSON.stringify((json as { errors: unknown }).errors)
        : text || res.statusText;
    throw new Error(`Lemon Squeezy API error (${res.status}): ${detail}`);
  }

  return json as T;
}

export async function createCheckout(options: {
  variantId: string;
  email: string;
  name?: string | null;
  userId: string;
  planId: string;
  interval: string;
  redirectUrl: string;
}): Promise<string> {
  const storeId = lemonStoreId();
  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not configured.");
  }

  const useTestMode =
    process.env.LEMONSQUEEZY_TEST_MODE === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.LEMONSQUEEZY_TEST_MODE !== "false");

  const response = await lemonFetch<
    LemonApiResponse<{
      attributes: { url: string };
    }>
  >("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          test_mode: useTestMode,
          checkout_data: {
            email: options.email,
            name: options.name ?? "",
            custom: {
              user_id: options.userId,
              plan_id: options.planId,
              interval: options.interval,
            },
          },
          product_options: {
            redirect_url: options.redirectUrl,
            enabled_variants: [Number(options.variantId)],
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: options.variantId },
          },
        },
      },
    }),
  });

  const url = response.data.attributes.url;
  if (!url) {
    throw new Error("Checkout URL missing from Lemon Squeezy response.");
  }
  return url;
}

export async function getCustomer(customerId: string): Promise<LemonCustomer> {
  const response = await lemonFetch<LemonApiResponse<LemonCustomer>>(
    `/customers/${customerId}`
  );
  return response.data;
}

export async function listCustomersByEmail(email: string): Promise<LemonCustomer[]> {
  const response = await lemonFetch<LemonApiListResponse<LemonCustomer>>(
    `/customers?filter[email]=${encodeURIComponent(email)}`
  );
  return response.data ?? [];
}

export async function getSubscription(subscriptionId: string): Promise<LemonSubscription> {
  const response = await lemonFetch<LemonApiResponse<LemonSubscription>>(
    `/subscriptions/${subscriptionId}`
  );
  return response.data;
}

export async function listSubscriptionsByEmail(email: string): Promise<LemonSubscription[]> {
  const response = await lemonFetch<LemonApiListResponse<LemonSubscription>>(
    `/subscriptions?filter[user_email]=${encodeURIComponent(email)}`
  );
  return response.data ?? [];
}

export async function listSubscriptionsByCustomer(customerId: string): Promise<LemonSubscription[]> {
  const response = await lemonFetch<LemonApiListResponse<LemonSubscription>>(
    `/customers/${encodeURIComponent(customerId)}/subscriptions`
  );
  return response.data ?? [];
}

export async function cancelSubscription(subscriptionId: string): Promise<LemonSubscription> {
  const response = await lemonFetch<LemonApiResponse<LemonSubscription>>(
    `/subscriptions/${subscriptionId}`,
    { method: "DELETE" }
  );
  return response.data;
}
