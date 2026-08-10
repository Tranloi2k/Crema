"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";

export function CredentialsSignupForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{
    email: string;
    devOtp?: string;
    retryAfter?: number;
    deliveryError?: string;
  } | null>(null);

  async function finishSignIn() {
    const result = await signIn("credentials", {
      email: verification?.email ?? email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    if (result?.error) {
      setVerification(null);
      setError("Email verified. Sign in with the password you used when creating the account.");
      return;
    }
    window.location.assign(callbackUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        requiresVerification?: boolean;
        devOtp?: string;
        retryAfter?: number;
        deliveryError?: string;
      };
      if (data.requiresVerification) {
        setVerification({
          email: email.trim().toLowerCase(),
          devOtp: data.devOtp,
          retryAfter: data.retryAfter,
          deliveryError: data.deliveryError,
        });
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
    } catch {
      setError("Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (verification) {
    return (
      <EmailOtpVerification
        email={verification.email}
        devOtp={verification.devOtp}
        initialRetryAfter={verification.retryAfter}
        initialError={verification.deliveryError}
        onVerified={finishSignIn}
        onBack={() => {
          setVerification(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
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
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">Confirm password</Label>
        <Input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="h-11 rounded-xl"
        />
      </div>

      <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
