import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

function newSlug() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

// Enable public sharing — assigns a slug if needed and flips isPublic on.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.userId, userId)),
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = row.publicSlug ?? newSlug();
  await db
    .update(templates)
    .set({ isPublic: true, publicSlug: slug })
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));

  return NextResponse.json({ isPublic: true, publicSlug: slug });
}

// Disable sharing — revokes the slug so existing links stop working.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.userId, userId)),
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(templates)
    .set({ isPublic: false, publicSlug: null })
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));

  return NextResponse.json({ isPublic: false, publicSlug: null });
}
