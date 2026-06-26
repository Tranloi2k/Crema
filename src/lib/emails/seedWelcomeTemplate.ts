import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import {
  WELCOME_EMAIL_TEMPLATE_NAME,
  createWelcomeEmailTemplate,
} from "@/lib/emails/welcomeEmailTemplate";

/** Seeds the editable welcome template preset for a new user account. */
export async function seedWelcomeTemplate(userId: string): Promise<void> {
  const now = new Date();
  await db.insert(templates).values({
    userId,
    name: WELCOME_EMAIL_TEMPLATE_NAME,
    content: JSON.stringify(
      createWelcomeEmailTemplate({ useMergeTags: true })
    ),
    createdAt: now,
    updatedAt: now,
    locked: false,
  });
}
