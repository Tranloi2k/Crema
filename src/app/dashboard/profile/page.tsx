"use client";

import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={user.name} email={user.email} image={user.image} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-medium">{user.name ?? "User"}</p>
            {user.email && (
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
