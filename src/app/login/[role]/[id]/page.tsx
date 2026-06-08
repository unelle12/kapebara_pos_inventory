import { notFound } from "next/navigation";
import { Crown, Shield, Users } from "lucide-react";

import { Logo } from "~/components/brand/logo";
import { PasswordForm } from "~/components/auth/password-form";
import { api } from "~/trpc/server";

type Role = "OWNER" | "MANAGER" | "CASHIER";

const ROLE_CONFIG = {
  OWNER: { icon: Crown, label: "Owner", color: "caramel" },
  MANAGER: { icon: Shield, label: "Manager", color: "sage" },
  CASHIER: { icon: Users, label: "Cashier", color: "espresso" },
} as const;

interface PageProps {
  params: Promise<{ role: string; id: string }>;
}

export default async function LoginAccountPage({ params }: PageProps) {
  const { role: roleParam, id } = await params;
  const role = roleParam.toUpperCase() as Role;

  if (!ROLE_CONFIG[role]) {
    notFound();
  }

  const accounts = await api.auth.getAccountsByRole({ role });
  const account = accounts.find((a) => a.id === id);

  if (!account) {
    notFound();
  }

  const { icon: Icon, label } = ROLE_CONFIG[role];

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
              Enter password
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-cream-200">
              Sign in to access your {label.toLowerCase()} dashboard
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-400">
            kapabara pos · v0.1
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo size="sm" />
          </div>

          <PasswordForm
            email={account.email}
            name={account.name}
            role={role}
            backHref={`/login/${role.toLowerCase()}`}
          />
        </div>
      </section>
    </main>
  );
}