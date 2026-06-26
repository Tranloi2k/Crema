import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const update: Partial<{ name: string; passwordHash: string }> = {};

  // Display name
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    update.name = name;
  }

  // Password change. Users who already have a password must confirm the current
  // one; OAuth-only users (no passwordHash) can set one for the first time.
  if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
    const passwordError = validatePassword(body.newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    if (user.passwordHash) {
      const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const valid = current ? await verifyPassword(current, user.passwordHash) : false;
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
    }
    update.passwordHash = await hashPassword(body.newPassword);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await db.update(users).set(update).where(eq(users.id, userId));

  return NextResponse.json({ ok: true, name: update.name ?? user.name });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // templates, accounts and sessions all cascade on user delete (see schema).
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
