import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Crema"
        width={32}
        height={32}
        className="h-8 w-8 transition-transform group-hover:scale-105"
        priority
      />
      <span className="text-lg font-semibold tracking-tight">Crema</span>
    </Link>
  );
}
