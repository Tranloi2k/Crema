"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthAction } from "@/lib/hooks/useRequireAuth";

export function RequireAuthDialog({
  action,
  onOpenChange,
}: {
  action: AuthAction | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const label = action === "export" ? "export" : "save";

  function handleSignIn() {
    const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Sign in to {label}</DialogTitle>
          <DialogDescription>
            Your draft is saved on this device. Sign in to {label} it without losing your work.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button type="button" onClick={handleSignIn}>
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
