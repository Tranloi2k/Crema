import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "@/lib/auth";
import {
  countCloudinaryUploadsInContent,
  isCloudinaryUrl,
} from "@/lib/billing/countTemplateUploads";
import { getPlanLimits } from "@/lib/billing/plans";
import { cloudinary } from "@/lib/cloudinary";
import { deleteCloudinaryAssetByUrl } from "@/lib/cloudinaryAssets";
import { db } from "@/lib/db/client";
import { templates, users } from "@/lib/db/schema";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const formData = await req.formData();
  const file = formData.get("file");
  const previousUrl = formData.get("previousUrl");
  const templateId = formData.get("templateId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof templateId !== "string" || !templateId) {
    return NextResponse.json({ error: "templateId is required." }, { status: 400 });
  }

  const template = await db.query.templates.findFirst({
    where: and(eq(templates.id, templateId), eq(templates.userId, userId)),
  });
  if (!template) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }
  if (template.locked) {
    return NextResponse.json(
      { error: "This template is locked on your current plan.", code: "TEMPLATE_LOCKED" },
      { status: 403 }
    );
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const limits = getPlanLimits(user?.plan ?? "free");

  if (limits.maxImagesPerTemplate === 0) {
    return NextResponse.json(
      { error: "Image upload is not available on the Free plan. Upgrade to Pro or paste an image URL.", code: "PLAN_NO_UPLOAD" },
      { status: 403 }
    );
  }

  const isReplace =
    typeof previousUrl === "string" && previousUrl && isCloudinaryUrl(previousUrl);
  const currentCount = countCloudinaryUploadsInContent(template.content);

  if (!isReplace && currentCount >= limits.maxImagesPerTemplate) {
    return NextResponse.json(
      {
        error: `Image limit reached for this template (${limits.maxImagesPerTemplate}).`,
        code: "PLAN_IMAGE_LIMIT",
      },
      { status: 403 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "crema",
    });

    if (typeof previousUrl === "string" && previousUrl && previousUrl !== result.secure_url) {
      await deleteCloudinaryAssetByUrl(previousUrl);
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed. Check Cloudinary credentials.", details: String(err) },
      { status: 500 }
    );
  }
}
