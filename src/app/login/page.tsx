"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { CredentialsLoginForm } from "@/components/auth/CredentialsLoginForm";
import { AUTH_ERRORS, OAuthButtons } from "@/components/auth/OAuthButtons";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode ? AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default : null;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account to continue building emails."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <CredentialsLoginForm errorMessage={errorMessage} />
      <AuthDivider />
      <OAuthButtons />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
