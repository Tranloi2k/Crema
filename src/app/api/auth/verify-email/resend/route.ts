import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { normalizeEmail, isValidEmail } from "@/lib/auth/password";
import {
  createEmailOtp,
  otpRetryAfterSeconds,
  sendEmailVerificationOtp,
} from "@/lib/auth/emailOtp";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.passwordHash || user.emailVerified) {
    return NextResponse.json({ ok: true, retryAfter: 60 });
  }

  const retryAfter = otpRetryAfterSeconds(user.emailVerificationSentAt);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: `Wait ${retryAfter} seconds before requesting another code.`, retryAfter },
      { status: 429 },
    );
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
    .where(eq(users.id, user.id));

  const delivery = await sendEmailVerificationOtp({ to: email, name: user.name, code: otp.code });
  if (!delivery.ok && !(process.env.NODE_ENV === "development" && delivery.skipped)) {
    // Keep the previous code usable when the email provider rejects the new one.
    // The hash condition prevents an older failed request from overwriting a newer OTP.
    await db
      .update(users)
      .set({
        emailVerificationCodeHash: user.emailVerificationCodeHash,
        emailVerificationExpiresAt: user.emailVerificationExpiresAt,
        emailVerificationSentAt: user.emailVerificationSentAt,
        emailVerificationAttempts: user.emailVerificationAttempts ?? 0,
      })
      .where(and(eq(users.id, user.id), eq(users.emailVerificationCodeHash, otp.codeHash)));
    return NextResponse.json(
      { error: "Could not send the verification email. Please try again.", retryAfter: 0 },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    retryAfter: 60,
    ...(process.env.NODE_ENV === "development" && delivery.skipped ? { devOtp: otp.code } : {}),
  });
}
