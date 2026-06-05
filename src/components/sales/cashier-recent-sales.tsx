"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, History } from "lucide-react";

import { api } from "~/trpc/react";

export function CashierRecentSales() {
  const { data, isLoading } = api.sale.recent.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="card p-12 text-center text-sm text-fg-muted">
        Loading recent sales…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-12">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-cream-100 text-espresso-700">
            <History className="size-5" />
          </div>
          <p className="font-display text-lg text-espresso-900">
            No sales yet today
          </p>
          <p className="text-sm text-fg-muted">
            Head to the Point of Sale to record your first sale.
          </p>
          <Link
            href="/pos"
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-espresso-700 px-4 font-mono text-xs uppercase tracking-wider text-cream-50 hover:bg-espresso-800"
          >
            Open POS
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-border">
        {data.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 px-4 py-3 text-sm"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-espresso-700">
              <History className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono font-medium text-fg">
                {s.reference}
              </p>
              <p className="truncate font-mono text-[10px] text-fg-subtle">
                {s._count.items} item{s._count.items === 1 ? "" : "s"} ·{" "}
                {s.paymentMethod} · {formatTime(s.createdAt)}
              </p>
            </div>
            <p className="font-mono text-base font-semibold tabular-nums text-fg">
              ₱{Number(s.total).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
