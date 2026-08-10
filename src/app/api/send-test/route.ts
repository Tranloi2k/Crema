import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getResendClient } from "@/lib/resend";

const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 300_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RateLimitStore = Map<string, number[]>;
const globalRateLimit = globalThis as typeof globalThis & {
  __cremaSendTestRateLimit?: RateLimitStore;
};
const rateLimitStore: RateLimitStore =
  globalRateLimit.__cremaSendTestRateLimit ??
  (globalRateLimit.__cremaSendTestRateLimit = new Map<string, number[]>());

function consumeRateLimit(key: string): number | null {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateLimitStore.get(key) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((recent[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
  return null;
}

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: { "Cache-Control": "no-store", ...headers },
    },
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return errorResponse("Sign in to send a test email.", 401);
  }

  const user = session.user as { id?: string; email?: string | null };
  const rateLimitKey = user.id ?? user.email;
  if (!rateLimitKey) {
    return errorResponse("Your session is invalid. Please sign in again.", 401);
  }

  const retryAfter = consumeRateLimit(rateLimitKey);
  if (retryAfter !== null) {
    return errorResponse(
      "Too many test emails. Please wait a few minutes and try again.",
      429,
      { "Retry-After": String(retryAfter) },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Invalid request body.", 400);
  }

  const payload = body as Record<string, unknown>;
  const to = typeof payload.to === "string" ? payload.to.trim() : "";
  const html = typeof payload.html === "string" ? payload.html.trim() : "";
  const requestedSubject =
    typeof payload.subject === "string" ? payload.subject.trim() : "";
  const subject = requestedSubject || "Test email from Crema";

  if (
    !to ||
    to.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(to)
  ) {
    return errorResponse("Enter a valid recipient email address.", 400);
  }
  if (!html) {
    return errorResponse("The email template is empty.", 400);
  }
  if (html.length > MAX_HTML_LENGTH) {
    return errorResponse("This template is too large to send as a test email.", 413);
  }
  if (
    subject.length > MAX_SUBJECT_LENGTH ||
    subject.includes("\r") ||
    subject.includes("\n")
  ) {
    return errorResponse("The email subject is invalid or too long.", 400);
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!process.env.RESEND_API_KEY?.trim() || !from) {
    console.error("[send-test] Resend is not configured");
    return errorResponse("Test email sending is not configured.", 503);
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[send-test] Resend rejected the email", {
        name: error.name,
        statusCode: error.statusCode,
      });

      if (error.name === "rate_limit_exceeded") {
        return errorResponse(
          "The email service is busy. Please wait a moment and try again.",
          429,
        );
      }
      if (
        error.name === "daily_quota_exceeded" ||
        error.name === "monthly_quota_exceeded"
      ) {
        return errorResponse(
          "The test-email sending limit has been reached. Please try again later.",
          503,
        );
      }
      if (
        error.name === "validation_error" ||
        error.name === "invalid_from_address" ||
        error.name === "invalid_parameter"
      ) {
        return errorResponse(
          "The email provider rejected the sender or recipient address.",
          400,
        );
      }

      return errorResponse("The email provider could not send this test email.", 502);
    }

    return NextResponse.json(
      { ok: true, id: data.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[send-test] Unexpected send failure", error);
    return errorResponse("Could not send the test email. Please try again.", 502);
  }
}
