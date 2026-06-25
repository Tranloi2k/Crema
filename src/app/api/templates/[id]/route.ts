import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { normalizeRoot } from "@/lib/defaultBlocks";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

export async function GET(
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

  return NextResponse.json({
    id: row.id,
    name: row.name,
    content: normalizeRoot(JSON.parse(row.content)),
    updatedAt: row.updatedAt,
    locked: row.locked ?? false,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.userId, userId)),
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (row.locked) {
    return NextResponse.json(
      { error: "This template is locked on your current plan.", code: "TEMPLATE_LOCKED" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const update: Partial<{ name: string; content: string; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (typeof body.name === "string") update.name = body.name;
  if (body.root) update.content = JSON.stringify(body.root);

  const [updated] = await db
    .update(templates)
    .set(update)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));

  return NextResponse.json({ ok: true });
}
