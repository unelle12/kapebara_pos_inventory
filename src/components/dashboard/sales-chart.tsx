"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { cn, formatCurrency } from "~/lib/utils";

type Point = { date: string; revenue: number; transactions: number };

export function SalesChart({
  data,
  className,
}: {
  data: Point[];
  className?: string;
}) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.66 0.140 65)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.66 0.140 65)" stopOpacity={0} />
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
            tickFormatter={(v: string) => format(parseISO(v), "EEE d")}
            tickMargin={8}
          />
          <YAxis
            stroke="oklch(0.55 0.030 70)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : `₱${v}`
            }
          />
          <Tooltip
            cursor={{ stroke: "oklch(0.66 0.140 65 / 0.3)", strokeWidth: 1 }}
            content={<ChartTooltip />}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="oklch(0.66 0.140 65)"
            strokeWidth={2.5}
            fill="url(#rev)"
            activeDot={{
              r: 5,
              fill: "oklch(0.66 0.140 65)",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        {format(parseISO(d.date), "EEE, MMM d")}
      </p>
      <p className="mt-1 font-display text-base text-espresso-900">
        {formatCurrency(d.revenue)}
      </p>
      <p className="text-xs text-fg-muted">
        {d.transactions} transaction{d.transactions === 1 ? "" : "s"}
      </p>
    </div>
  );
}
