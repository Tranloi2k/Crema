import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as { id: string }).id;
}
