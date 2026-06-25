import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { PricingSection } from "@/components/home/PricingSection";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
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
