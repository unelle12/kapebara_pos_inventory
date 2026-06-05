"use client";

import { Award, Medal, Trophy, User } from "lucide-react";

import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";

type LeaderboardRow = {
  rank: number;
  cashierId: string;
  name: string;
  role: string;
  revenue: number;
  transactions: number;
  itemsSold: number;
  avgTicket: number;
  share: number;
};

export function CashierLeaderboard({
  data,
  isLoading,
}: {
  data: LeaderboardRow[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-cream-100" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-fg-muted">
        No cashier activity in this range.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => {
        const widthPct = (c.revenue / maxRevenue) * 100;
        const Icon = c.rank === 1 ? Trophy : c.rank === 2 ? Medal : c.rank === 3 ? Award : User;
        const tone =
          c.rank === 1
            ? "border-caramel-300 bg-caramel-50/60"
            : c.rank === 2
              ? "border-cream-300 bg-cream-50/40"
              : c.rank === 3
                ? "border-clay-200 bg-clay-50/40"
                : "border-border bg-cream-50/40";
        return (
          <div
            key={c.cashierId}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4",
              tone,
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  c.rank === 1
                    ? "bg-caramel-200 text-caramel-800"
                    : c.rank === 2
                      ? "bg-cream-200 text-espresso-900"
                      : c.rank === 3
                        ? "bg-clay-200 text-clay-800"
                        : "bg-espresso-100 text-espresso-700",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    #{c.rank}
                  </span>
                  <span className="font-mono text-[10px] text-fg-subtle">
                    · {c.role.toLowerCase()}
                  </span>
                </div>
                <p className="truncate text-sm font-medium text-fg">{c.name}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
              <Stat label="Revenue" value={formatCurrency(c.revenue)} highlight />
              <Stat label="Txns" value={c.transactions.toString()} />
              <Stat label="Avg" value={formatCurrency(c.avgTicket)} />
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between font-mono text-[10px] text-fg-subtle">
                <span>{c.itemsSold} units</span>
                <span>{c.share.toFixed(1)}% share</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-cream-200">
                <div
                  className={cn(
                    "h-full rounded-full",
                    c.rank === 1
                      ? "bg-caramel-500"
                      : c.rank === 2
                        ? "bg-espresso-500"
                        : c.rank === 3
                          ? "bg-clay-500"
                          : "bg-sage-500",
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm tabular-nums",
          highlight ? "font-semibold text-espresso-900" : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
