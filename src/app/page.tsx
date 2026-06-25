import type { Metadata } from "next";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { PricingSection } from "@/components/home/PricingSection";
import { Footer } from "@/components/home/Footer";
import { HomeJsonLd } from "@/components/seo/HomeJsonLd";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
});

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeJsonLd />
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
