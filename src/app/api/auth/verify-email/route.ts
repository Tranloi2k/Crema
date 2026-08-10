import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { normalizeEmail, isValidEmail } from "@/lib/auth/password";
import { EMAIL_OTP_MAX_ATTEMPTS, verifyEmailOtpHash } from "@/lib/auth/emailOtp";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { seedWelcomeTemplate } from "@/lib/emails/seedWelcomeTemplate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit verification code." }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "The code is invalid or has expired." }, { status: 400 });
  }

  if (
    !user.emailVerificationCodeHash ||
    !user.emailVerificationExpiresAt ||
    user.emailVerificationExpiresAt.getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: "This code has expired. Request a new code.", code: "OTP_EXPIRED" },
      { status: 400 },
    );
  }

  const attempts = user.emailVerificationAttempts ?? 0;
  if (attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code.", code: "OTP_LOCKED" },
      { status: 429 },
    );
  }

  if (!verifyEmailOtpHash(email, code, user.emailVerificationCodeHash)) {
    const nextAttempts = attempts + 1;
    await db
      .update(users)
      .set({ emailVerificationAttempts: nextAttempts })
      .where(eq(users.id, user.id));
    const remainingAttempts = Math.max(0, EMAIL_OTP_MAX_ATTEMPTS - nextAttempts);
    return NextResponse.json(
      {
        error: remainingAttempts > 0
          ? `Incorrect code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
          : "Too many attempts. Request a new code.",
        code: remainingAttempts > 0 ? "OTP_INVALID" : "OTP_LOCKED",
        remainingAttempts,
      },
      { status: remainingAttempts > 0 ? 400 : 429 },
    );
  }

  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationSentAt: null,
      emailVerificationAttempts: 0,
    })
    .where(eq(users.id, user.id));

  try {
    await seedWelcomeTemplate(user.id);
  } catch {
    // Verification should succeed even if the starter template cannot be seeded.
  }

  return NextResponse.json({ verified: true });
}
