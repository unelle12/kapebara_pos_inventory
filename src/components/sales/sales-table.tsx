"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CreditCard, History, RotateCcw, Wallet } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { SkeletonRow } from "~/components/ui/skeleton";
import { TableEmptyState } from "~/components/ui/table-empty-state";
import { SaleDetailDialog } from "~/components/sales/sale-detail-dialog";

type SaleRow = {
  id: string;
  reference: string;
  status: "COMPLETED" | "REFUNDED" | "VOID";
  total: number;
  discount: number;
  paymentMethod: "CASH" | "CARD" | "EWALLET";
  createdAt: Date;
  cashier: { id: string; name: string };
  _count: { items: number; refunds: number };
};

type SaleListOutput = {
  items: SaleRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: { revenue: number; discount: number; count: number };
};

export function SalesTable({ initialData }: { initialData: SaleListOutput }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [params, setParams] = React.useState<URLSearchParams>(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
  );

  const page = Number(params.get("page") ?? "1") || 1;

  const query = api.sale.list.useQuery(
    {
      search: params.get("search") ?? undefined,
      cashierId: params.get("cashierId") ?? undefined,
      paymentMethod: (params.get("paymentMethod") as
        | "CASH" | "CARD" | "EWALLET" | "ALL" | undefined) ?? "ALL",
      status: (params.get("status") as
        | "COMPLETED" | "REFUNDED" | "VOID" | "ALL" | undefined) ?? "ALL",
      range: (params.get("range") as
        | "today" | "week" | "month" | "quarter" | "all" | undefined) ?? "month",
      page,
      pageSize: 25,
    },
    { initialData, refetchOnWindowFocus: false },
  );

  const data: SaleListOutput = query.data ?? initialData;

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setParams(next);
    const qs = next.toString();
    router.replace(qs ? `/sales?${qs}` : "/sales", { scroll: false });
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-cream-50/40 text-left">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Reference
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  When
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Cashier
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Method
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Items
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Total
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {query.isFetching && data.items.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={7} />
                ))
              ) : data.items.length === 0 ? (
                <TableEmptyState
                  colSpan={8}
                  filtered={Boolean(
                    params.get("search") ??
                      params.get("cashierId") ??
                      ((params.get("paymentMethod") &&
                        params.get("paymentMethod") !== "ALL") ??
                        (params.get("status") && params.get("status") !== "ALL")),
                  )}
                  title="No sales match"
                  description="Try a wider date range or clear the filters."
                  icon={History}
                  onClear={() => {
                    const next = new URLSearchParams(params.toString());
                    ["search", "cashierId", "paymentMethod", "status", "page"].forEach(
                      (k) => next.delete(k),
                    );
                    setParams(next);
                    router.replace(
                      next.toString() ? `/sales?${next.toString()}` : "/sales",
                      { scroll: false },
                    );
                  }}
                />
              ) : (
                data.items.map((s) => (
                  <tr
                    key={s.id}
                    className="group cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-cream-50/40"
                    onClick={() => setSelectedId(s.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-espresso-700">
                          <History className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-mono font-medium text-fg">
                            {s.reference}
                          </p>
                          {s._count.refunds > 0 && (
                            <p className="font-mono text-[10px] text-clay-700">
                              {s._count.refunds} refund{s._count.refunds > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      <p className="text-xs">{formatDate(s.createdAt)}</p>
                      <p className="font-mono text-[10px] text-fg-subtle">
                        {formatTime(s.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-fg">{s.cashier.name}</td>
                    <td className="px-4 py-3">
                      <MethodPill method={s.paymentMethod} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-fg-muted">
                      {s._count.items}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-mono text-base font-semibold tabular-nums text-fg">
                        ₱{s.total.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {s.discount > 0 && (
                        <p className="font-mono text-[10px] text-clay-700">
                          −₱{s.discount.toFixed(2)} disc
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "REFUNDED" ? (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                          refunded
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(s.id);
                          }}
                          title="View details / refund"
                        >
                          <RotateCcw className="size-3.5" />
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
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

      <SaleDetailDialog
        saleId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function MethodPill({ method }: { method: "CASH" | "CARD" | "EWALLET" }) {
  if (method === "CASH") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-700">
        <Wallet className="size-2.5" />
        Cash
      </span>
    );
  }
  if (method === "CARD") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-caramel-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-espresso-900">
        <CreditCard className="size-2.5" />
        Card
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-clay-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-clay-700">
      <CreditCard className="size-2.5" />
      E-Wallet
    </span>
  );
}

function StatusPill({ status }: { status: "COMPLETED" | "REFUNDED" | "VOID" }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-700">
        <span className="size-1.5 rounded-full bg-sage-500" />
        Completed
      </span>
    );
  }
  if (status === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-clay-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-clay-700">
        <RotateCcw className="size-2.5" />
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
      Void
    </span>
  );
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
