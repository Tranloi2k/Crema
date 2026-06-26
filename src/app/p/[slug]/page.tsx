import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { normalizeRoot } from "@/lib/defaultBlocks";
import { blocksToHtml } from "@/lib/export/toHtml";
import { PublicEmailFrame } from "@/components/public/PublicEmailFrame";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function getSharedTemplate(slug: string) {
  const row = await db.query.templates.findFirst({
    where: and(eq(templates.publicSlug, slug), eq(templates.isPublic, true)),
  });
  return row ?? null;
}

export default async function PublicTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getSharedTemplate(slug);
  if (!template) notFound();

  const root = normalizeRoot(JSON.parse(template.content));
  const html = blocksToHtml(root, { inboxChrome: true });

  return (
    <main className="min-h-screen bg-[#f4f4f5]">
      <div className="mx-auto max-w-[680px] px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{template.name}</p>
          <span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
            Shared preview
          </span>
        </header>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <PublicEmailFrame html={html} />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Made with Crema
        </p>
      </div>
    </main>
  );
}
