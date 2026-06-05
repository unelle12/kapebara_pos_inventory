"use client";

import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";

type CategoryRow = {
  categoryId: string;
  name: string;
  color: string | null;
  revenue: number;
  units: number;
  cogs: number;
  profit: number;
  share: number;
};

const COLOR_MAP: Record<string, string> = {
  caramel: "bg-caramel-500",
  sage: "bg-sage-500",
  clay: "bg-clay-500",
  espresso: "bg-espresso-700",
};

const COLOR_TEXT: Record<string, string> = {
  caramel: "text-caramel-700",
  sage: "text-sage-700",
  clay: "text-clay-700",
  espresso: "text-espresso-900",
};

export function CategoryBreakdown({
  data,
  isLoading,
}: {
  data: CategoryRow[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-cream-100" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-fg-muted">
        No data.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <ul className="space-y-3">
      {data.map((c) => {
        const widthPct = (c.revenue / maxRevenue) * 100;
        const margin = c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0;
        return (
          <li key={c.categoryId}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    COLOR_MAP[c.color ?? ""] ?? "bg-fg-subtle",
                  )}
                />
                <p className="truncate text-sm font-medium text-fg">{c.name}</p>
                <span className="font-mono text-[10px] text-fg-subtle">
                  {c.units} units
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    COLOR_TEXT[c.color ?? ""] ?? "text-fg-muted",
                  )}
                >
                  {c.share.toFixed(1)}%
                </span>
                <p className="font-mono text-sm font-semibold tabular-nums text-fg">
                  {formatCurrency(c.revenue)}
                </p>
              </div>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  COLOR_MAP[c.color ?? ""] ?? "bg-fg-subtle",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] text-fg-subtle">
              {formatCurrency(c.profit)} profit · {margin.toFixed(0)}% margin
            </p>
          </li>
        );
      })}
    </ul>
  );
}
