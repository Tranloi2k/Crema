import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, count, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { getPlanLimits } from "@/lib/billing/plans";
import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";
import { normalizeRoot } from "@/lib/defaultBlocks";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.downgradeSelectionPending) {
    return NextResponse.json(
      { error: "Complete template selection before creating new templates.", code: "DOWNGRADE_SELECTION_PENDING" },
      { status: 403 }
    );
  }

  const planId = user?.plan ?? "free";
  const limits = getPlanLimits(planId);

  if (limits.maxTemplates !== null) {
    const [countResult] = await db
      .select({ value: count() })
      .from(templates)
      .where(eq(templates.userId, userId));

    const templateCount = countResult?.value ?? 0;
    if (templateCount >= limits.maxTemplates) {
      return NextResponse.json(
        { error: `Template limit reached (${limits.maxTemplates}). Upgrade your plan.`, code: "PLAN_TEMPLATE_LIMIT" },
        { status: 403 }
      );
    }
  }

  const source = await db.query.templates.findFirst({
    where: and(eq(templates.id, id), eq(templates.userId, userId)),
  });
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const copyName = `Copy of ${source.name}`;

  const [created] = await db
    .insert(templates)
    .values({
      userId,
      name: copyName,
      content: source.content,
      createdAt: now,
      updatedAt: now,
      locked: false,
    })
    .returning();

  return NextResponse.json({
    id: created.id,
    name: created.name,
    content: normalizeRoot(JSON.parse(created.content)),
    updatedAt: created.updatedAt,
    createdAt: created.createdAt,
    locked: created.locked ?? false,
  });
}
