import Link from "next/link";
import { Logo } from "@/components/home/Logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0 hero-glow opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <Logo href="/" className="relative z-10 [&_span:last-child]:text-background" />
        <div className="relative z-10 max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Design beautiful emails{" "}
            <span className="text-primary-foreground/80">without writing HTML</span>
          </p>
          <p className="mt-4 text-sm text-background/70">
            Drag, drop, and ship — Crema turns blocks into pixel-perfect,
            inbox-ready HTML emails in minutes.
          </p>
        </div>
        <p className="relative z-10 text-xs text-background/50">
          © {new Date().getFullYear()} Crema
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-primary/10 to-transparent lg:hidden"
        />
        <div className="mb-8 w-full max-w-sm lg:hidden">
          <Logo href="/" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>

          {children}

          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>

          <p className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
