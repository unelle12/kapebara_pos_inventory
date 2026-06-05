"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus, Search, X } from "lucide-react";
import { UserRole } from "../../../generated/prisma";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export function UsersToolbar({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const roleFilter = searchParams.get("role") ?? "all";
  const activeFilter = searchParams.get("active") ?? "all";

  const updateParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "" || v === "all") params.delete(k);
        else params.set(k, v);
      });
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/users?${qs}` : "/users", { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = () => updateParams({ search: null, role: null, active: null });

  const hasFilters = search !== "" || roleFilter !== "all" || activeFilter !== "all";

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              placeholder="Search name or email…"
              defaultValue={search}
              onChange={(e) => updateParams({ search: e.target.value || null })}
              className="pl-9"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => updateParams({ role: e.target.value })}
            className={cn(
              "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            <option value="all">All roles</option>
            <option value={UserRole.OWNER}>Owner</option>
            <option value={UserRole.MANAGER}>Manager</option>
            <option value={UserRole.CASHIER}>Cashier</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => updateParams({ active: e.target.value })}
            className={cn(
              "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            <option value="all">All users</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-fg-muted">
            <span className="text-fg-subtle">showing</span>{" "}
            <span className="font-medium text-fg">{total}</span>{" "}
            <span className="text-fg-subtle">{total === 1 ? "user" : "users"}</span>
          </p>
          <Link href="/users/new">
            <Button variant="primary" size="md">
              <Plus className="size-4" />
              Add user
            </Button>
          </Link>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-xs text-fg-muted">
          <Filter className="size-3 text-fg-subtle" />
          <span className="font-mono uppercase tracking-wider text-fg-subtle">active:</span>
          {search && (
            <span className="rounded-pill bg-espresso-100 px-2 py-0.5 text-espresso-800">
              “{search}”
            </span>
          )}
          {roleFilter !== "all" && (
            <span className="rounded-pill bg-caramel-100 px-2 py-0.5 capitalize text-caramel-800">
              {roleFilter.toLowerCase()}
            </span>
          )}
          {activeFilter !== "all" && (
            <span className="rounded-pill bg-sage-100 px-2 py-0.5 text-sage-700">
              {activeFilter === "true" ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
