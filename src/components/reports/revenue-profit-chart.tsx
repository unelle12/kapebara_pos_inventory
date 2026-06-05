"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "~/lib/utils";

type Point = {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
  itemsSold: number;
};

export function RevenueProfitChart({
  data,
  isLoading,
}: {
  data: Point[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-fg-muted">
        Loading chart…
      </div>
    );
  }
  if (data.every((d) => d.revenue === 0)) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-fg-muted">
        No completed sales in this range.
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.140 65)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.66 0.140 65)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.090 145)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.55 0.090 145)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="oklch(0.90 0.012 80)"
            strokeDasharray="3 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="oklch(0.55 0.030 70)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
            tickMargin={8}
          />
          <YAxis
            stroke="oklch(0.55 0.030 70)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : `₱${v}`
            }
          />
          <Tooltip
            cursor={{ stroke: "oklch(0.66 0.140 65 / 0.3)", strokeWidth: 1 }}
            content={<ChartTooltip />}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="oklch(0.66 0.140 65)"
            strokeWidth={2.5}
            fill="url(#revGrad)"
            activeDot={{
              r: 5,
              fill: "oklch(0.66 0.140 65)",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="oklch(0.55 0.090 145)"
            strokeWidth={2.5}
            fill="url(#profitGrad)"
            activeDot={{
              r: 5,
              fill: "oklch(0.55 0.090 145)",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        {format(parseISO(d.date), "EEE, MMM d, yyyy")}
      </p>
      <p className="mt-1.5 flex items-center gap-2 font-mono text-sm text-espresso-900">
        <span className="size-2 rounded-full bg-caramel-500" />
        <span className="text-fg-muted">Revenue</span>
        <span className="ml-auto font-display font-semibold tabular-nums">
          {formatCurrency(d.revenue)}
        </span>
      </p>
      <p className="mt-1 flex items-center gap-2 font-mono text-sm text-espresso-900">
        <span className="size-2 rounded-full bg-sage-500" />
        <span className="text-fg-muted">Profit</span>
        <span className="ml-auto font-display font-semibold tabular-nums">
          {formatCurrency(d.profit)}
        </span>
      </p>
      <p className="mt-1 text-xs text-fg-muted">
        {d.transactions} txn · {d.itemsSold} units
      </p>
    </div>
  );
}
