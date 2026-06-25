import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getPlanLimits } from "@/lib/billing/plans";
import { getUserBilling } from "@/lib/billing/getUserBilling";
import { requireUserId } from "@/lib/billing/requireUser";
import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.downgradeSelectionPending) {
    return NextResponse.json({ error: "No template selection required." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const templateIds = Array.isArray(body.templateIds)
    ? body.templateIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  const limits = getPlanLimits(user.plan ?? "free");
  const maxTemplates = limits.maxTemplates;
  if (maxTemplates === null) {
    return NextResponse.json({ error: "Unlimited plan does not require selection." }, { status: 400 });
  }

  if (templateIds.length !== maxTemplates) {
    return NextResponse.json(
      { error: `Select exactly ${maxTemplates} template(s) to keep editable.` },
      { status: 400 }
    );
  }

  const owned = await db.query.templates.findMany({
    where: eq(templates.userId, userId),
    columns: { id: true },
  });
  const ownedIds = new Set(owned.map((t) => t.id));

  if (!templateIds.every((id: string) => ownedIds.has(id))) {
    return NextResponse.json({ error: "Invalid template selection." }, { status: 400 });
  }

  const selectedSet = new Set(templateIds);

  await db.transaction(async (tx) => {
    for (const row of owned) {
      await tx
        .update(templates)
        .set({ locked: !selectedSet.has(row.id) })
        .where(and(eq(templates.id, row.id), eq(templates.userId, userId)));
    }

    await tx
      .update(users)
      .set({ downgradeSelectionPending: false })
      .where(eq(users.id, userId));
  });

  const billing = await getUserBilling(userId);
  return NextResponse.json(billing);
}
