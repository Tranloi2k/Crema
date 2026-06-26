import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, inArray } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { templates, templateVersions } from "@/lib/db/schema";

// Don't snapshot on every 1.5s autosave — only keep a new checkpoint when the
// most recent one is at least this old. Keeps history meaningful and bounded.
const SNAPSHOT_THROTTLE_MS = 2 * 60 * 1000;
const MAX_VERSIONS_PER_TEMPLATE = 20;

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

async function ownedTemplate(templateId: string, userId: string) {
  return db.query.templates.findFirst({
    where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await ownedTemplate(id, userId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.query.templateVersions.findMany({
    where: eq(templateVersions.templateId, id),
    orderBy: (v, { desc: d }) => [d(v.createdAt)],
  });

  return NextResponse.json(
    rows.map((row) => ({ id: row.id, name: row.name, createdAt: row.createdAt }))
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await ownedTemplate(id, userId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latest = await db.query.templateVersions.findFirst({
    where: eq(templateVersions.templateId, id),
    orderBy: (v, { desc: d }) => [d(v.createdAt)],
  });

  const now = Date.now();
  if (latest && now - latest.createdAt.getTime() < SNAPSHOT_THROTTLE_MS) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await db.insert(templateVersions).values({
    templateId: id,
    name: template.name,
    content: template.content,
    createdAt: new Date(now),
  });

  // Prune to the most recent MAX_VERSIONS_PER_TEMPLATE snapshots.
  const all = await db.query.templateVersions.findMany({
    where: eq(templateVersions.templateId, id),
    orderBy: (v, { desc: d }) => [d(v.createdAt)],
    columns: { id: true },
  });
  if (all.length > MAX_VERSIONS_PER_TEMPLATE) {
    const stale = all.slice(MAX_VERSIONS_PER_TEMPLATE).map((v) => v.id);
    await db.delete(templateVersions).where(inArray(templateVersions.id, stale));
  }

  return NextResponse.json({ ok: true, skipped: false });
}
