import { Suspense } from "react";
import { Coffee, Loader2 } from "lucide-react";

import { Logo } from "~/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · kapabara",
};

export default function LoginPage() {
  return (
    <main className="grain relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Left — visual side */}
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
              Open the till
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] text-balance text-cream-50">
              Warm mornings.
              <br />
              <em className="not-italic text-caramel-300">Calm checkouts.</em>
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-cream-200">
              Sign in to ring up orders, watch the espresso machine do its
              thing, and keep the shelves stocked.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-400">
            kapabara pos · v0.1
          </p>
        </div>
      </aside>

      {/* Right — form side */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Logo size="sm" />
          </div>
          <h2 className="font-display text-3xl text-espresso-900">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Sign in to continue to the dashboard.
          </p>
          <Suspense
            fallback={
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-fg-muted">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
          <DemoCredentials />
        </div>
      </section>
    </main>
  );
}

function DemoCredentials() {
  const accounts = [
    { role: "Owner", email: "owner@kapabara.test" },
    { role: "Manager", email: "manager@kapabara.test" },
    { role: "Cashier", email: "anna@kapabara.test" },
  ];
  return (
    <div className="mt-10 rounded-2xl border border-border bg-cream-50/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        Demo accounts
      </p>
      <p className="mt-1 text-xs text-fg-muted">
        Password: <code className="rounded bg-cream-200 px-1.5 py-0.5 font-mono text-espresso-700">password123</code>
      </p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {accounts.map((a) => (
          <li key={a.email} className="flex items-center justify-between">
            <span className="text-fg-muted">{a.role}</span>
            <code className="font-mono text-espresso-700">{a.email}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
