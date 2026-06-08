import { Coffee } from "lucide-react";
import Link from "next/link";

import { Logo } from "~/components/brand/logo";
import { RegisterRoleSelectorWrapper } from "./role-selector-wrapper";

export const metadata = {
  title: "Register · kapabara",
};

export default function RegisterPage() {
  return (
    <main className="grain relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-espresso-900 text-cream-50 lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top left, oklch(0.66 0.140 65 / 0.45), transparent 55%), radial-gradient(ellipse at bottom right, oklch(0.55 0.082 130 / 0.35), transparent 55%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo size="md" className="[&_span]:!text-cream-50" />
          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-300">
              <Coffee className="mr-2 inline-block size-3 align-[-2px]" />
              Join the team
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] text-balance text-cream-50">
              Warm mornings.
              <br />
              <em className="not-italic text-caramel-300">Calm checkouts.</em>
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-cream-200">
              Create your account to start working with kapabara.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-400">
            kapabara pos · v0.1
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Logo size="sm" />
          </div>
          <h2 className="font-display text-3xl text-espresso-900 text-center">
            Create an account
          </h2>
          <p className="mt-1 text-sm text-fg-muted text-center">
            Choose your role to continue
          </p>
          <RegisterRoleSelectorWrapper />
          <p className="mt-6 text-center text-xs text-fg-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-caramel-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}