"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MailCheck, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailOtpVerification({
  email,
  devOtp: initialDevOtp,
  initialRetryAfter = 60,
  autoResend = false,
  initialError,
  onVerified,
  onBack,
}: {
  email: string;
  devOtp?: string;
  initialRetryAfter?: number;
  autoResend?: boolean;
  initialError?: string;
  onVerified: () => void | Promise<void>;
  onBack?: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [retryAfter, setRetryAfter] = useState(initialRetryAfter);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const autoResendStarted = useRef(false);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  async function resendCode() {
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
        devOtp?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not send another code.");
        if (typeof data.retryAfter === "number") setRetryAfter(data.retryAfter);
        return;
      }
      setDevOtp(data.devOtp);
      setRetryAfter(data.retryAfter ?? 60);
      setMessage("A new verification code has been sent.");
    } catch {
      setError("Could not connect to the email service. Please try again.");
    } finally {
      setResending(false);
    }
  }

  useEffect(() => {
    if (!autoResend || autoResendStarted.current) return;
    autoResendStarted.current = true;
    void resendCode();
    // resendCode intentionally runs once when this verification screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResend]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setVerifying(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "The code is invalid or has expired.");
        return;
      }
      await onVerified();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-muted/30 p-4 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-base font-semibold">Check your email</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
          The code expires in 10 minutes.
        </p>
      </div>

      {devOtp && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Development code: <span className="font-mono font-bold tracking-widest">{devOtp}</span>
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-verification-code">Verification code</Label>
          <Input
            id="email-verification-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            placeholder="000000"
            className="h-12 rounded-xl text-center font-mono text-xl font-semibold tracking-[0.45em]"
            aria-invalid={!!error}
          />
        </div>

        <Button type="submit" className="h-11 w-full rounded-full" disabled={verifying || code.length !== 6}>
          {verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify email"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {onBack ? (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Change email
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={() => void resendCode()}
          disabled={resending || retryAfter > 0}
          className="inline-flex items-center gap-1.5 font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <RefreshCw className={resending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          {resending ? "Sending…" : retryAfter > 0 ? `Resend in ${retryAfter}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
