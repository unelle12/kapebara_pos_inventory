"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { iconFor, QUICK_ACTIONS } from "~/lib/nav";
import { hasRole, type Role } from "~/lib/permissions";
import { cn } from "~/lib/utils";

const ICON_BG: Record<string, string> = {
  ShoppingCart: "bg-caramel-100 text-caramel-700",
  Package: "bg-sage-100 text-sage-700",
  PackageOpen: "bg-sage-100 text-sage-700",
  BarChart3: "bg-clay-100 text-clay-700",
  Users: "bg-espresso-100 text-espresso-700",
  Bell: "bg-clay-100 text-clay-700",
  Truck: "bg-caramel-100 text-caramel-700",
  Settings: "bg-cream-200 text-espresso-700",
};

export function QuickActions({ role }: { role: Role }) {
  const actions = QUICK_ACTIONS.filter((a) => hasRole(role, a.minRole)).slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => {
        const Icon = iconFor(a.icon);
        return (
          <Link
            key={a.href}
            href={a.href}
            className="card group flex items-center gap-3 p-4 transition-all hover:border-border-strong hover:shadow-sm"
          >
            <div className={cn("flex size-10 items-center justify-center rounded-xl", ICON_BG[a.icon] ?? "bg-cream-100 text-fg-muted")}>
              <Icon className="size-5" />
            </div>
            <p className="text-sm font-medium text-fg">{a.label}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function ManagerOnlyCta({ role }: { role: Role }) {
  if (hasRole(role, "MANAGER")) return null;
  return (
    <div className="card flex items-center gap-3 p-4 text-sm">
      <div className="flex size-9 items-center justify-center rounded-xl bg-caramel-100 text-caramel-700">
        <LayoutDashboard className="size-4" />
      </div>
      <p className="text-fg-muted">
        Sales charts, profit & top products are visible to{" "}
        <strong className="text-fg">managers</strong>. Your role is{" "}
        <strong className="text-fg">{role.toLowerCase()}</strong>.
      </p>
    </div>
  );
}
