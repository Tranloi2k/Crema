import { getAppBaseUrl } from "@/lib/appUrl";
import { blocksToHtml } from "@/lib/export/toHtml";
import { getResendClient } from "@/lib/resend";
import {
  WELCOME_EMAIL_SUBJECT,
  createWelcomeEmailTemplate,
} from "@/lib/emails/welcomeEmailTemplate";

function firstNameFrom(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function canSendEmail(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && key !== "re_placeholder");
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!canSendEmail()) {
    return { ok: false, skipped: true };
  }

  const firstName = firstNameFrom(name);
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;
  const html = blocksToHtml(
    createWelcomeEmailTemplate({ firstName, dashboardUrl })
  );

  try {
    const { error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Crema <onboarding@resend.dev>",
      to,
      subject: WELCOME_EMAIL_SUBJECT,
      html,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
