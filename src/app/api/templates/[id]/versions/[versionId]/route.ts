import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { templates, templateVersions } from "@/lib/db/schema";
import { normalizeRoot } from "@/lib/defaultBlocks";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.userId, userId)),
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const version = await db.query.templateVersions.findFirst({
    where: and(
      eq(templateVersions.id, versionId),
      eq(templateVersions.templateId, id)
    ),
  });
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: version.id,
    name: version.name,
    content: normalizeRoot(JSON.parse(version.content)),
    createdAt: version.createdAt,
  });
}
