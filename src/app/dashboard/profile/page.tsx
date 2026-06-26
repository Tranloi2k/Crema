"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = { kind: "idle" | "saving" | "ok" | "error"; message?: string };

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [name, setName] = useState("");
  const [nameStatus, setNameStatus] = useState<Status>({ kind: "idle" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>({ kind: "idle" });

  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameStatus({ kind: "saving" });
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNameStatus({ kind: "error", message: data.error ?? "Could not update name." });
      return;
    }
    await update({ name: data.name ?? name });
    setNameStatus({ kind: "ok", message: "Name updated." });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwStatus({ kind: "saving" });
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPwStatus({ kind: "error", message: data.error ?? "Could not change password." });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPwStatus({ kind: "ok", message: "Password changed." });
  }

  async function deleteAccount() {
    setDeleteStatus({ kind: "saving" });
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteStatus({ kind: "error", message: data.error ?? "Could not delete account." });
      return;
    }
    await signOut({ redirect: false });
    router.push("/");
  }

  function statusText(status: Status) {
    if (status.kind === "ok") {
      return <p className="text-sm text-emerald-600 dark:text-emerald-400">{status.message}</p>;
    }
    if (status.kind === "error") {
      return <p className="text-sm text-destructive">{status.message}</p>;
    }
    return null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>This name appears on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveName} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {statusText(nameStatus)}
            <Button
              type="submit"
              className="rounded-full"
              disabled={nameStatus.kind === "saving" || name.trim() === (user.name ?? "")}
            >
              {nameStatus.kind === "saving" ? "Saving..." : "Save name"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Set or change the password used for email sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank if you signed up with Google/GitHub"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {statusText(pwStatus)}
            <Button
              type="submit"
              className="rounded-full"
              disabled={pwStatus.kind === "saving" || newPassword.length === 0}
            >
              {pwStatus.kind === "saving" ? "Saving..." : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
          <CardDescription>
            Permanently deletes your account and all templates. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
            />
          </div>
          {statusText(deleteStatus)}
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={confirmDelete !== "DELETE" || deleteStatus.kind === "saving"}
            onClick={deleteAccount}
          >
            {deleteStatus.kind === "saving" ? "Deleting..." : "Delete my account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
