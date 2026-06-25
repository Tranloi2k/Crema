import { NextResponse } from "next/server";

import { getUserBilling } from "@/lib/billing/getUserBilling";
import { requireUserId } from "@/lib/billing/requireUser";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billing = await getUserBilling(userId);
    if (!billing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(billing);
  } catch (err) {
    console.error("GET /api/billing/usage", err);
    return NextResponse.json(
      { error: "Failed to load billing usage." },
      { status: 500 }
    );
  }
}
