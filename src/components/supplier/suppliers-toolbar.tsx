"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Plus, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export function SuppliersToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const activeFilter = searchParams.get("active") ?? "all";

  const updateParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "" || v === "all") params.delete(k);
        else params.set(k, v);
      });
      // Reset to page 1 when filters change.
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/suppliers?${qs}` : "/suppliers", { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = () => updateParams({ search: null, active: null });

  const hasFilters = search !== "" || activeFilter !== "all";

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search + filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              placeholder="Search name, contact, email…"
              defaultValue={search}
              onChange={(e) => updateParams({ search: e.target.value || null })}
              className="pl-9"
            />
          </div>

          <select
            value={activeFilter}
            onChange={(e) => updateParams({ active: e.target.value })}
            className={cn(
              "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            <option value="all">All suppliers</option>
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

        {/* Right side: count + add */}
        <div className="flex items-center gap-3">
          {/* Count will be filled by the parent page via props or we can fetch it */}
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs text-fg-muted">
              <span className="text-fg-subtle">showing</span>{" "}
              <span className="text-fg font-medium" id="supplier-count">
                –
              </span>{" "}
              <span className="text-fg-subtle">suppliers</span>
            </p>
            <Link href="/suppliers/new">
              <Button variant="primary" size="md">
                <Plus className="size-4" />
                Add supplier
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-xs text-fg-muted">
          <Filter className="size-3 text-fg-subtle" />
          <span className="font-mono uppercase tracking-wider text-fg-subtle">active:</span>
          {search && (
            <span className="rounded-pill bg-espresso-100 px-2 py-0.5 text-espresso-800">
              “{search}”
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