"use client";

import { CreditCard, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "~/lib/utils";

type PaymentSlice = {
  method: "CASH" | "CARD" | "EWALLET";
  revenue: number;
  count: number;
  share: number;
};

const METHOD_META: Record<
  PaymentSlice["method"],
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CASH: { label: "Cash", color: "oklch(0.55 0.090 145)", icon: Wallet },
  CARD: { label: "Card", color: "oklch(0.66 0.140 65)", icon: CreditCard },
  EWALLET: { label: "E-Wallet", color: "oklch(0.62 0.150 30)", icon: CreditCard },
};

export function PaymentBreakdown({
  data,
  isLoading,
}: {
  data: PaymentSlice[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-fg-muted">
        Loading…
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-fg-muted">
        No data.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="method"
              innerRadius={36}
              outerRadius={56}
              paddingAngle={2}
              strokeWidth={2}
              stroke="oklch(0.99 0.005 80)"
            >
              {data.map((d) => (
                <Cell key={d.method} fill={METHOD_META[d.method].color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {data.map((d) => {
          const meta = METHOD_META[d.method];
          const Icon = meta.icon;
          return (
            <li
              key={d.method}
              className="flex items-center gap-3 rounded-lg border border-border bg-cream-50/40 p-2.5"
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
              >
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{meta.label}</p>
                <p className="font-mono text-[10px] text-fg-subtle">
                  {d.count} txn · {d.share.toFixed(1)}%
                </p>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-fg">
                {formatCurrency(d.revenue)}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="text-center font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        Total {formatCurrency(total)}
      </p>
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PaymentSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const meta = METHOD_META[d.method];
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-md">
      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {meta.label}
      </p>
      <p className="mt-1 font-display text-sm font-semibold tabular-nums text-espresso-900">
        {formatCurrency(d.revenue)}
      </p>
      <p className="text-[10px] text-fg-muted">{d.share.toFixed(1)}% of total</p>
    </div>
  );
}
