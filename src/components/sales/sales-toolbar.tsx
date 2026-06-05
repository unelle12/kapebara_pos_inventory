"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Filter, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type Cashier = { id: string; name: string; role: string };

const RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "7d" },
  { value: "month", label: "30d" },
  { value: "quarter", label: "90d" },
  { value: "all", label: "All" },
];

const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "EWALLET", label: "E-Wallet" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "VOID", label: "Void" },
];

export function SalesToolbar({
  cashiers,
  total,
}: {
  cashiers: Cashier[];
  total: number;
}) {
  const router = useRouter();
  const [params, setParams] = React.useState<URLSearchParams>(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
  );
  const [searchInput, setSearchInput] = React.useState(params.get("search") ?? "");

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    next.delete("page"); // reset pagination on filter change
    setParams(next);
    const qs = next.toString();
    router.replace(qs ? `/sales?${qs}` : "/sales", { scroll: false });
  }

  const activeFilters = [
    params.get("cashierId") && "cashier",
    params.get("paymentMethod") && params.get("paymentMethod") !== "ALL" && "method",
    params.get("status") && params.get("status") !== "ALL" && "status",
  ].filter(Boolean).length;

  return (
    <div className="card p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ search: searchInput.trim() || null });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by reference (e.g. KP-20260602-0042)…"
            className="h-9 w-full rounded-lg border border-border bg-cream-50/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-caramel-500 focus:bg-cream-50 focus:outline-none"
          />
        </form>

        {/* Range */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-cream-50/40 p-0.5">
          <Calendar className="ml-1.5 size-3.5 text-fg-subtle" />
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => update({ range: r.value })}
              className={cn(
                "h-7 rounded-md px-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                (params.get("range") ?? "month") === r.value
                  ? "bg-espresso-700 text-cream-50"
                  : "text-fg-muted hover:bg-cream-100 hover:text-fg",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Cashier */}
        <select
          value={params.get("cashierId") ?? ""}
          onChange={(e) => update({ cashierId: e.target.value || null })}
          className="h-9 rounded-lg border border-border bg-cream-50/60 px-3 text-sm text-fg focus:border-caramel-500 focus:outline-none"
        >
          <option value="">All cashiers</option>
          {cashiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.role.toLowerCase()}
            </option>
          ))}
        </select>

        {/* Payment method */}
        <select
          value={params.get("paymentMethod") ?? "ALL"}
          onChange={(e) => update({ paymentMethod: e.target.value })}
          className="h-9 rounded-lg border border-border bg-cream-50/60 px-3 text-sm text-fg focus:border-caramel-500 focus:outline-none"
        >
          {METHOD_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={params.get("status") ?? "ALL"}
          onChange={(e) => update({ status: e.target.value })}
          className="h-9 rounded-lg border border-border bg-cream-50/60 px-3 text-sm text-fg focus:border-caramel-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Reset */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setParams(new URLSearchParams());
              router.replace("/sales", { scroll: false });
            }}
            className="text-clay-700"
          >
            <X className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Footer row: result count + active-filter chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-fg-muted">
        <Filter className="size-3 text-fg-subtle" />
        <span className="font-mono uppercase tracking-wider text-fg-subtle">
          {total} results
        </span>
        {params.get("search") && (
          <Chip
            label={`Ref: ${params.get("search")}`}
            onClear={() => {
              setSearchInput("");
              update({ search: null });
            }}
          />
        )}
        {params.get("cashierId") && (
          <Chip
            label={`Cashier: ${cashiers.find((c) => c.id === params.get("cashierId"))?.name ?? "?"}`}
            onClear={() => update({ cashierId: null })}
          />
        )}
        {params.get("paymentMethod") && params.get("paymentMethod") !== "ALL" && (
          <Chip
            label={`Method: ${params.get("paymentMethod")}`}
            onClear={() => update({ paymentMethod: null })}
          />
        )}
        {params.get("status") && params.get("status") !== "ALL" && (
          <Chip
            label={`Status: ${params.get("status")}`}
            onClear={() => update({ status: null })}
          />
        )}
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-caramel-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-espresso-900">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 rounded-full p-0.5 hover:bg-caramel-200"
        aria-label={`Clear ${label}`}
      >
        <X className="size-2.5" />
      </button>
    </span>
  );
}
