import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Email editor",
  description: "Design and export your email template with Crema.",
  path: "/editor",
  noIndex: true,
});

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
