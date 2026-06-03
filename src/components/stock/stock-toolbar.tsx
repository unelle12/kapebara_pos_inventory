"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Filter, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { products: number };
};

const STOCK_FILTERS: { value: "ALL" | "OK" | "LOW" | "OUT" | "TRACK_OFF"; label: string }[] = [
  { value: "ALL", label: "All stock" },
  { value: "OK", label: "Healthy" },
  { value: "LOW", label: "Low" },
  { value: "OUT", label: "Out" },
  { value: "TRACK_OFF", label: "Not tracked" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "stock:asc", label: "Stock ↑ (lowest first)" },
  { value: "stock:desc", label: "Stock ↓ (highest first)" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "product:asc", label: "Product A–Z" },
  { value: "threshold:asc", label: "Threshold ↑" },
  { value: "updated:desc", label: "Recently updated" },
];

export function StockToolbar({
  categories,
  total,
  filters,
}: {
  categories: Category[];
  total: number;
  filters: { lowCount: number; outCount: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const stockStatus =
    (searchParams.get("stockStatus") as
      | "ALL" | "OK" | "LOW" | "OUT" | "TRACK_OFF"
      | null) ?? "ALL";
  const sortBy = searchParams.get("sortBy") ?? "stock";
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc" | null) ?? "asc";

  const updateParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === "" || v === "ALL") params.delete(k);
        else params.set(k, v);
      });
      if (!("page" in patch)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/stock?${qs}` : "/stock", { scroll: false });
    },
    [router, searchParams],
  );

  const clearAll = () =>
    updateParams({ search: null, categoryId: null, stockStatus: null, sortBy: null, sortDir: null });

  const hasFilters =
    search !== "" ||
    categoryId !== "" ||
    stockStatus !== "ALL" ||
    sortBy !== "stock" ||
    sortDir !== "asc";

  // Build export URL that mirrors the current filters
  const exportQs = new URLSearchParams();
  if (search) exportQs.set("search", search);
  if (categoryId) exportQs.set("categoryId", categoryId);
  if (stockStatus !== "ALL") exportQs.set("stockStatus", stockStatus);
  const exportUrl = `/api/stock/export${exportQs.toString() ? `?${exportQs.toString()}` : ""}`;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search + filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input
              placeholder="Search variant or product…"
              defaultValue={search}
              onChange={(e) => updateParams({ search: e.target.value || null })}
              className="pl-9"
            />
          </div>

          <select
            value={stockStatus}
            onChange={(e) => updateParams({ stockStatus: e.target.value })}
            className={selectCls}
          >
            {STOCK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
                {f.value === "LOW" && filters.lowCount > 0 ? ` (${filters.lowCount})` : ""}
                {f.value === "OUT" && filters.outCount > 0 ? ` (${filters.outCount})` : ""}
              </option>
            ))}
          </select>

          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value || null })}
            className={selectCls}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c._count.products})
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(":");
              updateParams({ sortBy: sb ?? null, sortDir: sd ?? null });
            }}
            className={selectCls}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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

        {/* Right side: count + export */}
        <div className="flex items-center gap-3">
          <p className="font-mono text-xs text-fg-muted">
            <span className="text-fg-subtle">showing</span>{" "}
            <span className="text-fg font-medium">{total.toLocaleString()}</span>{" "}
            <span className="text-fg-subtle">variants</span>
          </p>
          <a href={exportUrl} download>
            <Button variant="secondary" size="md">
              <Download className="size-4" />
              Export CSV
            </Button>
          </a>
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

const selectCls = cn(
  "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
  "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
);
