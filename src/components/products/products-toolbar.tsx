"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Plus, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { StockStatus } from "~/components/products/stock-badge";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  _count: { products: number };
};

const STOCK_FILTERS: { value: "ALL" | StockStatus | "INACTIVE"; label: string }[] = [
  { value: "ALL", label: "All stock" },
  { value: "OK", label: "In stock" },
  { value: "LOW", label: "Low stock" },
  { value: "OUT", label: "Out of stock" },
  { value: "INACTIVE", label: "Inactive" },
];

export function ProductsToolbar({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const stockStatus =
    (searchParams.get("stockStatus") as
      | "ALL"
      | StockStatus
      | "INACTIVE"
      | null) ?? "ALL";

  const updateParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "" || v === "ALL") params.delete(k);
        else params.set(k, v);
      });
      // Reset to page 1 when filters change.
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = () => updateParams({ search: null, categoryId: null, stockStatus: null });

  const hasFilters = search !== "" || categoryId !== "" || stockStatus !== "ALL";

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search + filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              placeholder="Search name or SKU…"
              defaultValue={search}
              onChange={(e) => updateParams({ search: e.target.value || null })}
              className="pl-9"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value || null })}
            className={cn(
              "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c._count.products})
              </option>
            ))}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => updateParams({ stockStatus: e.target.value })}
            className={cn(
              "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            {STOCK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
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
          <p className="font-mono text-xs text-fg-muted">
            <span className="text-fg-subtle">showing</span>{" "}
            <span className="text-fg font-medium">{total.toLocaleString()}</span>{" "}
            <span className="text-fg-subtle">products</span>
          </p>
          <Link href="/products/new">
            <Button variant="primary" size="md">
              <Plus className="size-4" />
              Add product
            </Button>
          </Link>
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
          {categoryId && (
            <span className="rounded-pill bg-caramel-100 px-2 py-0.5 text-caramel-800">
              {categories.find((c) => c.id === categoryId)?.name ?? "category"}
            </span>
          )}
          {stockStatus !== "ALL" && (
            <span className="rounded-pill bg-sage-100 px-2 py-0.5 text-sage-700">
              {STOCK_FILTERS.find((f) => f.value === stockStatus)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
