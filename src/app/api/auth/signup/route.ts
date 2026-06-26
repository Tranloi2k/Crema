import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { hashPassword, normalizeEmail, validatePassword } from "@/lib/auth/password";
import { sendWelcomeEmail } from "@/lib/emails/sendWelcomeEmail";
import { seedWelcomeTemplate } from "@/lib/emails/seedWelcomeTemplate";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (existing.passwordHash) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json(
      {
        error:
          "This email is already registered with Google or GitHub. Sign in with that provider instead.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      emailVerified: new Date(),
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
    });

  try {
    await seedWelcomeTemplate(created.id);
  } catch {
    // Signup should succeed even if template seed fails.
  }

  void sendWelcomeEmail({ to: created.email!, name: created.name ?? name }).catch(() => {});

  return NextResponse.json(
    { id: created.id, name: created.name, email: created.email },
    { status: 201 }
  );
}
