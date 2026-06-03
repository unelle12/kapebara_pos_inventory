"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  Sliders,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { StockBadge, type StockStatus } from "~/components/products/stock-badge";
import { cn } from "~/lib/utils";
import { AdjustStockDialog } from "~/components/stock/adjust-stock-dialog";

type VariantRow = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  cost: number;
  attributes: unknown;
  updatedAt: Date;
  status: StockStatus;
  product: {
    id: string;
    name: string;
    sku: string;
    trackStock: boolean;
    lowStockThreshold: number;
    active: boolean;
    category: { id: string; name: string; slug?: string; color: string | null };
    supplier: { id: string; name: string } | null;
  };
  lastMovement: {
    type: string;
    qty: number;
    note: string | null;
    createdAt: Date;
    userName: string;
  } | null;
};

type StockListOutput = {
  items: VariantRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  totalActive: number;
};

export function StockTable({
  initialData,
}: {
  initialData: StockListOutput;
}) {
  const router = useRouter();
  const [adjustTarget, setAdjustTarget] = React.useState<VariantRow | null>(null);
  const search = React.useMemo(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
    [],
  );
  const page = Number(search.get("page") ?? "1");

  const query = api.stock.list.useQuery(
    {
      search: search.get("search") ?? undefined,
      categoryId: search.get("categoryId") ?? undefined,
      stockStatus: (search.get("stockStatus") ?? "ALL") as
        | "ALL" | "OK" | "LOW" | "OUT" | "TRACK_OFF",
      sortBy: (search.get("sortBy") ?? "stock") as
        | "name" | "sku" | "product" | "stock" | "threshold" | "updated",
      sortDir: (search.get("sortDir") ?? "asc") as "asc" | "desc",
      page,
      pageSize: 25,
    },
    { initialData: initialData as never, refetchOnWindowFocus: false },
  );

  const data = (query.data ?? initialData) as StockListOutput;

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    router.replace(qs ? `/stock?${qs}` : "/stock", { scroll: false });
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-cream-50/40 text-left">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Variant
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Category
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Stock
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Threshold
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Last movement
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {query.isFetching && data.items.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-cream-100 text-espresso-700">
                        <Search className="size-5" />
                      </div>
                      <p className="font-display text-lg text-espresso-900">
                        No variants match
                      </p>
                      <p className="text-sm text-fg-muted">
                        Try a different search term or clear the filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((v) => {
                  const attrs = (v.attributes ?? {}) as Record<string, string>;
                  const attrStr = Object.keys(attrs).length
                    ? Object.entries(attrs)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(" · ")
                    : "";
                  const margin = v.price > 0 ? ((v.price - v.cost) / v.price) * 100 : 0;
                  return (
                    <tr
                      key={v.id}
                      className="group border-b border-border/60 last:border-0 transition-colors hover:bg-cream-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-espresso-700">
                            <Package className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">{v.name}</p>
                            <p className="truncate font-mono text-[11px] text-fg-subtle">
                              {v.product.name} · {v.sku}
                            </p>
                            {attrStr && (
                              <p className="truncate font-mono text-[10px] text-fg-subtle">
                                {attrStr}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              v.product.category.color === "caramel" && "bg-caramel-500",
                              v.product.category.color === "sage" && "bg-sage-500",
                              v.product.category.color === "clay" && "bg-clay-500",
                              v.product.category.color === "espresso" && "bg-espresso-700",
                              !["caramel", "sage", "clay", "espresso"].includes(
                                v.product.category.color ?? "",
                              ) && "bg-fg-subtle",
                            )}
                          />
                          {v.product.category.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.product.trackStock ? (
                          <div>
                            <p
                              className={cn(
                                "font-mono text-base font-semibold tabular-nums",
                                v.status === "OUT"
                                  ? "text-red-700"
                                  : v.status === "LOW"
                                    ? "text-clay-700"
                                    : "text-fg",
                              )}
                            >
                              {v.stock}
                            </p>
                            <p className="font-mono text-[10px] text-fg-subtle">
                              {margin >= 0 ? `${margin.toFixed(0)}% m` : "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-fg-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-fg-muted">
                        {v.product.lowStockThreshold}
                      </td>
                      <td className="px-4 py-3">
                        {v.lastMovement ? (
                          <div>
                            <p className="text-xs text-fg">
                              <span
                                className={cn(
                                  "font-mono font-medium tabular-nums",
                                  v.lastMovement.qty > 0 ? "text-sage-700" : "text-clay-700",
                                )}
                              >
                                {v.lastMovement.qty > 0 ? "+" : ""}
                                {v.lastMovement.qty}
                              </span>{" "}
                              <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                                {v.lastMovement.type.toLowerCase()}
                              </span>
                            </p>
                            <p className="font-mono text-[10px] text-fg-subtle">
                              {timeAgo(v.lastMovement.createdAt)} · {v.lastMovement.userName}
                            </p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-fg-subtle">never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {v.status === "OK" && (
                          <StockBadge status="OK" qty={v.stock} />
                        )}
                        {v.status === "LOW" && (
                          <StockBadge status="LOW" qty={v.stock} />
                        )}
                        {v.status === "OUT" && <StockBadge status="OUT" />}
                        {v.status === "TRACK_OFF" && <StockBadge status="TRACK_OFF" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdjustTarget(v)}
                          disabled={!v.product.trackStock}
                          title={
                            v.product.trackStock
                              ? "Adjust stock"
                              : "Stock tracking is disabled"
                          }
                        >
                          <Sliders className="size-3.5" />
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-border bg-cream-50/40 px-4 py-3 text-xs text-fg-muted sm:flex-row sm:items-center">
          <p>
            <span className="font-mono uppercase tracking-wider text-fg-subtle">page</span>{" "}
            <span className="text-fg">{data.page}</span>{" "}
            <span className="text-fg-subtle">of</span>{" "}
            <span className="text-fg">{data.pageCount}</span>{" "}
            <span className="text-fg-subtle">·</span>{" "}
            <span className="text-fg">{data.total}</span>{" "}
            <span className="text-fg-subtle">total</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || query.isFetching}
              onClick={() => updateParams({ page: String(data.page - 1) })}
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.pageCount || query.isFetching}
              onClick={() => updateParams({ page: String(data.page + 1) })}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <AdjustStockDialog
        variant={adjustTarget}
        onClose={() => setAdjustTarget(null)}
      />
    </>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/60">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 w-full max-w-[120px] animate-pulse rounded-md bg-cream-200"
            style={{ width: `${50 + (i * 17) % 50}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function timeAgo(d: Date) {
  const ms = Date.now() - new Date(d).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString();
}
