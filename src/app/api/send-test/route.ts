import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getResendClient } from "@/lib/resend";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, html, subject } = await req.json().catch(() => ({}));
  if (!to || !html) {
    return NextResponse.json({ error: "Missing 'to' or 'html'" }, { status: 400 });
  }

  try {
    const result = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Crema <onboarding@resend.dev>",
      to,
      subject: subject || "Test email from Crema",
      html,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json(
      { error: "Send failed. Check Resend API key.", details: String(err) },
      { status: 500 }
    );
  }
}
