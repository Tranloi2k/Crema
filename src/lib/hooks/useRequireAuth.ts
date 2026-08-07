"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";

export type AuthAction = "save" | "export";

export function useRequireAuth() {
  const { status } = useSession();
  const [requestedAction, setRequestedAction] = useState<AuthAction | null>(null);

  const requireAuth = useCallback(
    (action: AuthAction, callback: () => void | Promise<void>) => {
      if (status === "loading") return;
      if (status === "authenticated") {
        void callback();
        return;
      }
      setRequestedAction(action);
    },
    [status],
  );

  return {
    requireAuth,
    authStatus: status,
    requestedAction,
    closeAuthPrompt: () => setRequestedAction(null),
  };
}
