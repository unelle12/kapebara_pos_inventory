"use client";

import { Package } from "lucide-react";

import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";

type TopProduct = {
  rank: number;
  productId: string;
  name: string;
  sku: string;
  category: string;
  categoryColor: string | null;
  unitsSold: number;
  revenue: number;
  cogs: number;
};

const CATEGORY_COLOR: Record<string, string> = {
  caramel: "bg-caramel-500",
  sage: "bg-sage-500",
  clay: "bg-clay-500",
  espresso: "bg-espresso-700",
};

export function TopProductsTable({
  data,
  isLoading,
}: {
  data: TopProduct[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-full animate-pulse rounded-lg bg-cream-100"
          />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-fg-muted">
        <Package className="size-5 text-fg-subtle" />
        <p>No sales in this range yet.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left">
          <tr>
            <th className="w-10 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              #
            </th>
            <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Product
            </th>
            <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Units
            </th>
            <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Revenue
            </th>
            <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Margin
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const profit = p.revenue - p.cogs;
            const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
            const widthPct = (p.revenue / maxRevenue) * 100;
            return (
              <tr
                key={p.productId}
                className="group border-b border-border/60 last:border-0"
              >
                <td className="py-2 pr-2 font-mono text-xs text-fg-subtle">
                  {p.rank}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cream-100 text-espresso-700">
                      <Package className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">{p.name}</p>
                      <p className="flex items-center gap-1.5 truncate font-mono text-[10px] text-fg-subtle">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            CATEGORY_COLOR[p.categoryColor ?? ""] ?? "bg-fg-subtle",
                          )}
                        />
                        {p.category}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2 text-right font-mono text-xs tabular-nums text-fg-muted">
                  {p.unitsSold}
                </td>
                <td className="py-2">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-fg">
                      {formatCurrency(p.revenue)}
                    </p>
                    <div className="mt-1 ml-auto h-1 w-24 overflow-hidden rounded-full bg-cream-100">
                      <div
                        className="h-full rounded-full bg-caramel-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2 text-right">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      margin >= 50
                        ? "text-sage-700"
                        : margin >= 30
                          ? "text-caramel-700"
                          : "text-clay-700",
                    )}
                  >
                    {margin.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
