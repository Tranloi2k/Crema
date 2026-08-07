import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { count, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import { getPlanLimits } from "@/lib/billing/plans";
import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";
import { createRootBlock, normalizeRoot } from "@/lib/defaultBlocks";
import { getPresetTemplate } from "@/lib/emails/presetTemplates";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const rows = await db.query.templates.findMany({
    where: eq(templates.userId, userId),
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  });

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      content: normalizeRoot(JSON.parse(row.content)),
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      locked: row.locked ?? false,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

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

  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const defaultName = `Template ${now.toISOString().slice(0, 16).replace("T", " ")}`;
  const presetId = typeof body.preset === "string" ? body.preset : "";
  const preset = presetId ? getPresetTemplate(presetId) : undefined;
  const content = body.root ? normalizeRoot(body.root) : preset ? preset.build() : createRootBlock();
  const requestedName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
  const name = requestedName || preset?.templateName || defaultName;
  const [created] = await db
    .insert(templates)
    .values({
      userId,
      name,
      content: JSON.stringify(content),
      createdAt: now,
      updatedAt: now,
      locked: false,
    })
    .returning();

  return NextResponse.json({ id: created.id, name: created.name, locked: created.locked ?? false });
}
