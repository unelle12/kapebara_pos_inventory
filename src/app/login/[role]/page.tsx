import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2, Crown, Shield, Users } from "lucide-react";
import Link from "next/link";

import { Logo } from "~/components/brand/logo";
import { AccountCard } from "~/components/auth/account-card";
import { api } from "~/trpc/server";

type Role = "OWNER" | "MANAGER" | "CASHIER";

const ROLE_CONFIG = {
  OWNER: { icon: Crown, label: "Owner", color: "caramel" },
  MANAGER: { icon: Shield, label: "Manager", color: "sage" },
  CASHIER: { icon: Users, label: "Cashier", color: "espresso" },
} as const;

interface PageProps {
  params: Promise<{ role: string }>;
}

export async function generateStaticParams() {
  return ["owner", "manager", "cashier"].map((role) => ({ role }));
}

export default async function LoginRolePage({ params }: PageProps) {
  const { role: roleParam } = await params;
  const role = roleParam.toUpperCase() as Role;

  if (!ROLE_CONFIG[role]) {
    notFound();
  }

  const accounts = await api.auth.getAccountsByRole({ role });
  const { icon: Icon, label } = ROLE_CONFIG[role];

  const singleAccount = accounts.length === 1 ? accounts[0] : null;

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
              <Icon className="mr-2 inline-block size-3 align-[-2px]" />
              {label} sign in
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] text-balance text-cream-50">
              Select your account
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-cream-200">
              {accounts.length} active {label.toLowerCase()}{accounts.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-400">
            kapabara pos · v0.1
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo size="sm" />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <Link href="/login" className="text-fg-muted hover:text-fg flex items-center gap-1">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel-50 px-3 py-1 text-xs font-medium text-caramel-700">
              {label}
            </span>
          </div>

          {singleAccount ? (
            <AccountCard account={singleAccount} role={role} />
          ) : (
            <Suspense
              fallback={
                <div className="flex items-center justify-center gap-2 text-sm text-fg-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Loading accounts…
                </div>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {accounts.map((account: { id: string; name: string; email: string }) => (
                  <AccountCard key={account.id} account={account} role={role} />
                ))}
              </div>
            </Suspense>
          )}

          {accounts.length === 0 && (
            <div className="text-center py-12 text-fg-muted">
              <p>No active {label.toLowerCase()} accounts found.</p>
              <p className="text-sm mt-1">Contact the owner to create an account.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}