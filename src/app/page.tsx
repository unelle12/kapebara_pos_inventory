import Link from "next/link";
import { ArrowRight, Coffee, Database, ShieldCheck } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Logo } from "~/components/brand/logo";
import { auth } from "~/server/auth";
import { ROLE_LABELS } from "~/lib/permissions";
import { cn } from "~/lib/utils";

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <main className="grain relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[920px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.74 0.135 68 / 0.55), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.65 0.085 130 / 0.45), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            {signedIn ? (
              <>
                <span className="hidden text-sm text-fg-muted sm:inline">
                  Hi, {session?.user.name?.split(" ")[0] ?? "friend"} ·{" "}
                  <span className="font-medium text-fg">
                    {ROLE_LABELS[session!.user.role]}
                  </span>
                </span>

                <Link href="/dashboard">
                  <Button variant="primary" size="sm">
                    Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Open dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="mt-16 grid grid-cols-1 items-center gap-12 lg:mt-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-sm">
              <ShieldCheck className="size-3.5 text-sage-500" />
              8 of 15 tasks shipped · Inventory live
            </span>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[1.05] tracking-tight text-balance text-espresso-900 sm:text-6xl lg:text-7xl">
              A warm, fast
              <br />
              <em className="not-italic text-caramel-600">point of sale</em>
              <br />
              for the kapabara café.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-fg-muted text-pretty">
              Sign in to a warm dashboard with live KPIs, browse the catalog,
              adjust stock with an audit trail, and export it all to CSV. The
              POS terminal is up next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={signedIn ? "/dashboard" : "/login"}>
                <Button variant="primary" size="lg">
                  <Coffee className="size-5" />
                  {signedIn ? "Go to dashboard" : "Sign in to continue"}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  <Database className="size-5" />
                  Try a demo account
                </Button>
              </Link>
            </div>
          </div>

          <div className="animate-scale-up">
            <AuthCard />
          </div>
        </section>

        <section className="mt-20 mb-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl text-espresso-900">
                Build progress
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                8 of 15 tasks complete. Next: suppliers CRUD + restock page (C4).
              </p>
            </div>
          </div>
          <PhaseGrid />
        </section>
      </div>
    </main>
  );
}

function AuthCard() {
  return (
    <div className="card-elevated grain relative overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            Auth · Auth.js v5
          </p>
          <p className="mt-1 font-display text-xl text-espresso-900">
            Credentials + JWT
          </p>
        </div>
        <span className="rounded-pill bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">
          live
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {[
          { l: "Sign-in page", c: "bg-sage-500", t: "ok" },
          { l: "Role-based procedures", c: "bg-sage-500", t: "ok" },
          { l: "Protected /dashboard", c: "bg-sage-500", t: "ok" },
          { l: "Middleware redirect", c: "bg-sage-500", t: "ok" },
          { l: "bcrypt password hash", c: "bg-sage-500", t: "ok" },
          { l: "Sign-out", c: "bg-sage-500", t: "ok" },
        ].map((row) => (
          <div
            key={row.l}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", row.c)} />
              <span className="text-sm text-fg">{row.l}</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-sage-700">
              {row.t}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-border bg-cream-50 p-3 font-mono text-[10px] text-fg-muted">
        <p>owner@kapabara.test → OWNER</p>
        <p>manager@kapabara.test → MANAGER</p>
        <p>anna@kapabara.test → CASHIER</p>
      </div>
    </div>
  );
}

function PhaseGrid() {
  const phases = [
    { id: "A", name: "Foundation", count: 3, done: 3 },
    { id: "B", name: "App shell", count: 2, done: 2 },
    { id: "C", name: "Inventory", count: 4, done: 3 },
    { id: "D", name: "POS", count: 3, done: 0 },
    { id: "E", name: "Reports & security", count: 2, done: 0 },
    { id: "F", name: "Polish & deploy", count: 2, done: 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {phases.map((p) => {
        const pct = Math.round((p.done / p.count) * 100);
        return (
          <div
            key={p.id}
            className={cn(
              "card p-4 transition-all",
              p.done > 0 && "ring-1 ring-caramel-400/40",
              p.done === p.count && "ring-2 ring-sage-400/50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                Phase {p.id}
              </span>
              <span className="font-mono text-[10px] text-fg-muted">
                {p.done}/{p.count}
              </span>
            </div>
            <p className="mt-2 font-display text-base text-espresso-900">
              {p.name}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-cream-200">
              <div
                className={cn(
                  "h-full rounded-pill transition-all duration-500",
                  p.done === p.count ? "bg-sage-500" : "bg-caramel-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
