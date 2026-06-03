"use client";

import Link from "next/link";
import { AlertTriangle, Bell, BellRing, Package } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";
import { hasRole } from "~/lib/permissions";
import { cn } from "~/lib/utils";

export function NotificationsBell() {
  const { data: session } = useSession();
  const canViewList = hasRole(session?.user.role ?? "CASHIER", "MANAGER");

  const { data: count = 0 } = api.dashboard.lowStockCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: items = [] } = api.stock.lowStock.useQuery(
    { limit: 6 },
    { refetchInterval: 60_000, enabled: count > 0 && canViewList },
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          aria-label="Notifications"
        >
          {count > 0 ? (
            <BellRing className="size-4 animate-pulse-soft text-caramel-700" />
          ) : (
            <Bell className="size-4" />
          )}
          {count > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-semibold text-white ring-2 ring-surface">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "size-4",
                count > 0 ? "text-clay-600" : "text-sage-600",
              )}
            />
            <p className="text-sm font-medium text-fg">
              {count > 0
                ? `${count} low-stock item${count === 1 ? "" : "s"}`
                : "All good — nothing is low"}
            </p>
          </div>
        </div>
        <Separator />
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <Package className="size-5" />
            </div>
            <p className="text-sm font-medium text-fg">Stock is healthy</p>
            <p className="text-xs text-fg-muted">
              Nothing at or below threshold. We&apos;ll let you know.
            </p>
          </div>
        ) : (
          <>
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {items.map((it) => (
                <li key={it.id}>
                  <Link
                    href="/stock?filter=low"
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-cream-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {it.productName}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {it.name} · {it.sku}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "font-mono text-sm font-semibold",
                          it.stock === 0
                            ? "text-red-700"
                            : it.stock < it.threshold
                              ? "text-clay-700"
                              : "text-fg",
                        )}
                      >
                        {it.stock}
                      </p>
                      <p className="font-mono text-[10px] text-fg-subtle">
                        /{it.threshold}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="p-1.5">
              <Link
                href="/stock?filter=low"
                className="block rounded-lg px-2.5 py-2 text-center text-sm font-medium text-caramel-700 hover:bg-caramel-50"
              >
                View all in stock →
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
