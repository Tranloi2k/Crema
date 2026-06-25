"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const devBypassAvailable = process.env.NODE_ENV === "development";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered with another sign-in method. Use the original provider.",
  OAuthSignin: "Could not connect to the provider. Check your OAuth configuration.",
  OAuthCallback: "The provider returned an error. Please try again.",
  OAuthCreateAccount: "Could not create an account from the provider. Please try again.",
  Callback: "Sign-in failed. Please try again.",
  Configuration:
    "Auth configuration error. Check NEXTAUTH_URL (port 3001) and redirect URIs.",
  CredentialsSignin: "Invalid email or password.",
  Default: "Sign-in failed. Please try again.",
};

export function OAuthButtons() {
  const [providers, setProviders] = useState<Record<string, { id: string }> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then(setProviders)
      .catch(() => setProviders({}));
  }, []);

  const showGoogle = !!providers?.google;
  const showGithub = !!providers?.github;
  const showDevBypass = devBypassAvailable && !!providers?.["dev-bypass"];
  const loadingProviders = providers === null;

  async function handleSignIn(provider: string) {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  if (loadingProviders) {
    return (
      <div className="space-y-3">
        <div className="h-11 animate-pulse rounded-full bg-muted" />
        <div className="h-11 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const hasProviders = showGoogle || showGithub || showDevBypass;

  return (
    <div className="space-y-3">
      {showGoogle && (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full rounded-full border-border/80 bg-background text-sm font-medium shadow-sm",
            "hover:bg-muted/50"
          )}
          disabled={!!loading}
          onClick={() => handleSignIn("google")}
        >
          <GoogleIcon className="mr-2.5 h-5 w-5" />
          {loading === "google" ? "Connecting…" : "Continue with Google"}
        </Button>
      )}

      {showGithub && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full border-border/80 bg-background text-sm font-medium shadow-sm hover:bg-muted/50"
          disabled={!!loading}
          onClick={() => handleSignIn("github")}
        >
          <GithubIcon className="mr-2.5 h-5 w-5" />
          {loading === "github" ? "Connecting…" : "Continue with GitHub"}
        </Button>
      )}

      {showDevBypass && (
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full rounded-full text-sm font-medium"
          disabled={!!loading}
          onClick={() => handleSignIn("dev-bypass")}
        >
          {loading === "dev-bypass" ? "Connecting…" : "Continue as Dev User"}
        </Button>
      )}

      {!hasProviders && (
        <p className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
          No sign-in providers configured.
        </p>
      )}

      {hasProviders && (
        <p className="pt-1 text-center text-xs text-muted-foreground">
          Free to start · No credit card required
        </p>
      )}
    </div>
  );
}
