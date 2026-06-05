"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "~/lib/utils";

type Hour = {
  hour: number;
  label: string;
  revenue: number;
  transactions: number;
};

export function HourlyHeatmap({
  data,
  isLoading,
}: {
  data: Hour[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
        Loading…
      </div>
    );
  }
  if (data.every((d) => d.transactions === 0)) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-fg-muted">
        No sales in this range.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="space-y-3">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="12%"
          >
            <CartesianGrid
              stroke="oklch(0.90 0.012 80)"
              strokeDasharray="3 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="oklch(0.55 0.030 70)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              tickMargin={4}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "oklch(0.66 0.140 65 / 0.06)" }}
              content={<BarTooltip />}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((d) => {
                const intensity = d.revenue / max;
                return (
                  <Cell
                    key={d.hour}
                    fill={barColor(intensity)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        <span>low</span>
        <div
          className="mx-2 h-1.5 flex-1 rounded-full"
          style={{
            background:
              "linear-gradient(to right, oklch(0.95 0.025 80), oklch(0.66 0.140 65))",
          }}
        />
        <span>peak</span>
      </div>
      {/* Peak summary */}
      <PeakSummary data={data} />
    </div>
  );
}

function PeakSummary({ data }: { data: Hour[] }) {
  if (data.length === 0) return null;
  const peak = data.reduce((max, d) => (d.revenue > max.revenue ? d : max), data[0]!);
  return (
    <div className="rounded-lg border border-border bg-cream-50/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        Peak hour
      </p>
      <p className="mt-1 font-display text-lg text-espresso-900">
        {peak.label} · {formatCurrency(peak.revenue)}
      </p>
      <p className="font-mono text-[10px] text-fg-muted">
        {peak.transactions} transactions at this hour
      </p>
    </div>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Hour }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-md">
      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {formatHour(d.hour)}
      </p>
      <p className="mt-1 font-display text-sm font-semibold tabular-nums text-espresso-900">
        {formatCurrency(d.revenue)}
      </p>
      <p className="text-[10px] text-fg-muted">{d.transactions} transactions</p>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

/** Pick a bar color based on the bar's revenue intensity (0..1). */
function barColor(intensity: number): string {
  if (intensity <= 0) return "oklch(0.94 0.012 80)";
  // Light caramel to deep caramel
  const l = 0.95 - 0.30 * intensity;
  const c = 0.025 + 0.115 * intensity;
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} 65)`;
}
