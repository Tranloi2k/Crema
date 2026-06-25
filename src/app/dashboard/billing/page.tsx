import { Suspense } from "react";
import BillingPageClient from "./BillingPageClient";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-6 py-10">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      }
    >
      <BillingPageClient />
    </Suspense>
  );
}
