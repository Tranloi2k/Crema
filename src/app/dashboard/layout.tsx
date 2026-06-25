import { Navbar } from "@/components/dashboard/Navbar";
import { DowngradeSelectionGate } from "@/components/billing/TemplateSelectionModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <DowngradeSelectionGate />
      <div className="flex-1">{children}</div>
    </div>
  );
}
