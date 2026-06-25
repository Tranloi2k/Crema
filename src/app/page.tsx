import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { PricingSection } from "@/components/home/PricingSection";
import { Footer } from "@/components/home/Footer";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { getUserBilling } from "@/lib/billing/getUserBilling";
import { authOptions } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";
import type { PlanId } from "@/lib/billing/plans";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
});

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id: string }).id : null;
  const billing = userId ? await getUserBilling(userId) : null;
  const initialUsage = billing
    ? {
        plan: billing.plan as PlanId,
        planInterval: billing.planInterval,
        planStatus: billing.planStatus,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <HomeJsonLd />
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <PricingSection initialUsage={initialUsage} />
      </main>
      <Footer />
    </div>
  );
}
