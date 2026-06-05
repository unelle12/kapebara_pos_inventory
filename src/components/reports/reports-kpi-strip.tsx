"use client";

import {
  CircleDollarSign,
  CreditCard,
  Package,
  Receipt,
  TrendingUp,
  Undo2,
} from "lucide-react";

import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";

type Summary = {
  revenue: number;
  discount: number;
  tax: number;
  cogs: number;
  profit: number;
  margin: number;
  transactions: number;
  itemsSold: number;
  avgTicket: number;
  refunds: { count: number; amount: number };
};

export function ReportsKpiStrip({
  summary,
  isLoading,
}: {
  summary: Summary | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-cream-200" />
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-cream-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi
        label="Revenue"
        value={formatCurrency(summary.revenue)}
        icon={CircleDollarSign}
        tone="sage"
        sub={`${summary.transactions} sales`}
      />
      <Kpi
        label="Gross profit"
        value={formatCurrency(summary.profit)}
        icon={TrendingUp}
        tone="default"
        sub={`${summary.margin.toFixed(1)}% margin`}
      />
      <Kpi
        label="COGS"
        value={formatCurrency(summary.cogs)}
        icon={Package}
        tone="warn"
        sub={`${summary.itemsSold} units sold`}
      />
      <Kpi
        label="Avg ticket"
        value={formatCurrency(summary.avgTicket)}
        icon={Receipt}
        tone="default"
      />
      <Kpi
        label="Transactions"
        value={summary.transactions.toLocaleString()}
        icon={CreditCard}
        tone="default"
      />
      <Kpi
        label="Refunds"
        value={summary.refunds.count.toString()}
        icon={Undo2}
        tone={summary.refunds.count > 0 ? "warn" : "default"}
        sub={
          summary.refunds.amount > 0
            ? `−${formatCurrency(summary.refunds.amount)}`
            : "no refunds"
        }
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "sage" | "warn" | "danger";
  sub?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-fg-subtle" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl tabular-nums",
          tone === "sage"
            ? "text-sage-700"
            : tone === "warn"
              ? "text-clay-700"
              : tone === "danger"
                ? "text-red-700"
                : "text-espresso-900",
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 font-mono text-[10px] text-fg-subtle">{sub}</p>
      )}
    </div>
  );
}
