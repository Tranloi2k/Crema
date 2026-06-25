"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { CredentialsSignupForm } from "@/components/auth/CredentialsSignupForm";
import { AUTH_ERRORS, OAuthButtons } from "@/components/auth/OAuthButtons";

function SignupForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const oauthError = errorCode ? AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default : null;

  return (
    <AuthShell
      title="Create your account"
      description="Get started free — build and export email templates in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <CredentialsSignupForm />
      {oauthError && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {oauthError}
        </p>
      )}
      <AuthDivider />
      <OAuthButtons />
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
