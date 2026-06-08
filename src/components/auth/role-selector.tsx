"use client";

import Link from "next/link";
import { Crown, Shield, Users, Coffee, Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

type Role = "OWNER" | "MANAGER" | "CASHIER";

const ROLE_CONFIG: Record<Role, { icon: React.ComponentType<{ className?: string }>; label: string; description: string; color: string }> = {
  OWNER: { icon: Crown, label: "Owner", description: "Full access to all features", color: "caramel" },
  MANAGER: { icon: Shield, label: "Manager", description: "Manage staff, inventory, reports", color: "sage" },
  CASHIER: { icon: Users, label: "Cashier", description: "Process orders and payments", color: "espresso" },
};

const REGISTER_ROLE_CONFIG: Record<Exclude<Role, "OWNER">, { icon: React.ComponentType<{ className?: string }>; label: string; description: string; color: string }> = {
  MANAGER: { icon: Shield, label: "Manager", description: "Manage staff, inventory, reports", color: "sage" },
  CASHIER: { icon: Coffee, label: "Cashier", description: "Process orders and payments", color: "espresso" },
};

interface RoleSelectorProps {
  mode: "login" | "register";
  isLoading?: boolean;
}

export function RoleSelector({ mode, isLoading }: RoleSelectorProps) {
  const config = mode === "login" ? ROLE_CONFIG : REGISTER_ROLE_CONFIG;
  const roles = Object.keys(config) as (keyof typeof config)[];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl w-full">
      {roles.map((role) => {
        const { icon: Icon, label, description, color } = config[role];
        return (
          <Link
            key={role}
            href={mode === "login" ? `/login/${role.toLowerCase()}` : `/register/${role.toLowerCase()}`}
            className={cn(
              "group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all",
              "bg-cream-50/40 border-border hover:border-caramel-300 hover:bg-cream-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-200",
              isLoading && "pointer-events-none opacity-60"
            )}
            aria-disabled={isLoading}
          >
            <div
              className={cn(
                "mb-4 flex size-14 items-center justify-center rounded-xl transition-colors",
                `bg-${color}-100 text-${color}-700`
              )}
            >
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl font-medium text-espresso-900">{label}</h3>
            <p className="mt-1 text-sm text-fg-muted text-center">{description}</p>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-cream-50/80 rounded-2xl">
                <Loader2 className="size-6 animate-spin text-caramel-600" />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}