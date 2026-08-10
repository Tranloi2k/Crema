"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";

export function CredentialsLoginForm({
  errorMessage,
  callbackUrl = "/dashboard",
}: {
  errorMessage?: string | null;
  callbackUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  async function finishSignIn() {
    const result = await signIn("credentials", {
      email: verificationEmail ?? email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    if (result?.error) {
      setVerificationEmail(null);
      setError("Email verified, but sign-in failed. Check your password and try again.");
      return;
    }
    window.location.assign(callbackUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setVerificationEmail(email.trim().toLowerCase());
          return;
        }
        setError("Invalid email or password.");
        return;
      }

      // Full navigation so middleware sees the session cookie on production.
      window.location.assign(callbackUrl);
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayError = error ?? errorMessage;

  if (verificationEmail) {
    return (
      <EmailOtpVerification
        email={verificationEmail}
        initialRetryAfter={0}
        autoResend
        onVerified={finishSignIn}
        onBack={() => {
          setVerificationEmail(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {displayError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11 rounded-xl"
        />
      </div>

      <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
