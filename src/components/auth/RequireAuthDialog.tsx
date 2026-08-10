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
  const copy =
    action === "send-test"
      ? {
          title: "Sign in to send a test email",
          description:
            "Sign in to send this template to an inbox and protect the email service from misuse.",
        }
      : action === "export"
        ? {
            title: "Sign in to export",
            description:
              "Your draft is saved on this device. Sign in to export it without losing your work.",
          }
        : {
            title: "Sign in to save",
            description:
              "Your draft is saved on this device. Sign in to save it without losing your work.",
          };

  function handleSignIn() {
    const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
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
