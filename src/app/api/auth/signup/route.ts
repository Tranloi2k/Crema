import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { hashPassword, isValidEmail, normalizeEmail, validatePassword } from "@/lib/auth/password";
import {
  createEmailOtp,
  otpRetryAfterSeconds,
  sendEmailVerificationOtp,
} from "@/lib/auth/emailOtp";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

function otpResponse({
  code,
  emailSent,
  retryAfter = 60,
  deliveryError,
}: {
  code?: string;
  emailSent: boolean;
  retryAfter?: number;
  deliveryError?: string;
}) {
  return {
    requiresVerification: true,
    emailSent,
    retryAfter,
    ...(deliveryError ? { deliveryError } : {}),
    ...(process.env.NODE_ENV === "development" && code ? { devOtp: code } : {}),
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    if (!existing.passwordHash) {
      return NextResponse.json(
        { error: "This email is registered with Google or GitHub. Sign in with that provider instead." },
        { status: 409 },
      );
    }
    if (existing.emailVerified) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const retryAfter = otpRetryAfterSeconds(existing.emailVerificationSentAt);
    if (retryAfter > 0) {
      return NextResponse.json(otpResponse({ emailSent: true, retryAfter }), { status: 200 });
    }

    const otp = createEmailOtp(email);
    await db
      .update(users)
      .set({
        emailVerificationCodeHash: otp.codeHash,
        emailVerificationExpiresAt: otp.expiresAt,
        emailVerificationSentAt: otp.sentAt,
        emailVerificationAttempts: 0,
      })
      .where(eq(users.id, existing.id));

    const delivery = await sendEmailVerificationOtp({ to: email, name: existing.name, code: otp.code });
    const deliveryError = !delivery.ok && !(process.env.NODE_ENV === "development" && delivery.skipped)
      ? "The verification email could not be sent. Check email configuration, then request a new code."
      : undefined;
    return NextResponse.json(
      otpResponse({ code: delivery.skipped ? otp.code : undefined, emailSent: delivery.ok, deliveryError }),
      { status: 200 },
    );
  }

  const passwordHash = await hashPassword(password);
  const otp = createEmailOtp(email);
  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      emailVerified: null,
      emailVerificationCodeHash: otp.codeHash,
      emailVerificationExpiresAt: otp.expiresAt,
      emailVerificationSentAt: otp.sentAt,
      emailVerificationAttempts: 0,
    })
    .returning({ id: users.id, name: users.name, email: users.email });

  const delivery = await sendEmailVerificationOtp({ to: email, name, code: otp.code });
  const deliveryError = !delivery.ok && !(process.env.NODE_ENV === "development" && delivery.skipped)
    ? "The verification email could not be sent. Check email configuration, then request a new code."
    : undefined;
  return NextResponse.json(
    {
      id: created.id,
      email: created.email,
      ...otpResponse({ code: delivery.skipped ? otp.code : undefined, emailSent: delivery.ok, deliveryError }),
    },
    { status: 201 },
  );
}
