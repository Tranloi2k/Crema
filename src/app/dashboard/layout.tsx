import type { Metadata } from "next";
import { Navbar } from "@/components/dashboard/Navbar";
import { DowngradeSelectionGate } from "@/components/billing/TemplateSelectionModal";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Manage your email templates in Crema.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <DowngradeSelectionGate />
      <main className="flex-1 bg-muted/40">{children}</main>
    </div>
  );
}
