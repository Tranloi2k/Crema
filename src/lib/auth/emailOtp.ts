import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { getResendClient } from "@/lib/resend";

export const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
export const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

function otpSecret(): string {
  const secret = process.env.EMAIL_OTP_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return "crema-local-development-otp-secret";
  throw new Error("EMAIL_OTP_SECRET or NEXTAUTH_SECRET is required");
}

export function generateEmailOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashEmailOtp(email: string, code: string): string {
  return createHmac("sha256", otpSecret())
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function verifyEmailOtpHash(email: string, code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashEmailOtp(email, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createEmailOtp(email: string, now = new Date()) {
  const code = generateEmailOtp();
  return {
    code,
    codeHash: hashEmailOtp(email, code),
    sentAt: now,
    expiresAt: new Date(now.getTime() + EMAIL_OTP_TTL_MS),
  };
}

export function otpRetryAfterSeconds(sentAt: Date | null, now = Date.now()): number {
  if (!sentAt) return 0;
  return Math.max(0, Math.ceil((sentAt.getTime() + EMAIL_OTP_RESEND_COOLDOWN_MS - now) / 1000));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmailVerificationOtp({
  to,
  name,
  code,
}: {
  to: string;
  name?: string | null;
  code: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "re_placeholder") return { ok: false, skipped: true };

  const safeName = escapeHtml(name?.trim() || "there");
  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Crema <onboarding@resend.dev>",
      to,
      subject: `${code} is your Crema verification code`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;">Hi ${safeName},</p>
            <h1 style="margin:0 0 12px;font-size:24px;">Verify your email</h1>
            <p style="margin:0 0 24px;color:#475569;line-height:1.6;">Enter this code in Crema to finish creating your account. It expires in 10 minutes.</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:10px;text-align:center;background:#f1f5f9;border-radius:12px;padding:18px 12px;">${code}</div>
            <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">If you did not request this code, you can safely ignore this email.</p>
          </div>
        </div>`,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Email delivery failed" };
  }
}
