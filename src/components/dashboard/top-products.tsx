import Link from "next/link";
import { Package } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { formatCurrency } from "~/lib/utils";

type Row = {
  rank: number;
  productId: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
};

export function TopProducts({
  rows,
  days,
}: {
  rows: Row[];
  days: number;
}) {
  if (rows.length === 0) {
    return <EmptyState />;
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            Top products · last {days} days
          </p>
          <p className="mt-1 font-display text-lg text-espresso-900">
            Best movers at the till
          </p>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-caramel-700 hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-cream-50/70">
            <tr className="text-left text-xs text-fg-muted">
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Category</th>
              <th className="px-3 py-2.5 text-right font-medium">Units</th>
              <th className="px-3 py-2.5 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.productId}
                className="border-t border-border transition-colors hover:bg-cream-50/50"
              >
                <td className="px-3 py-3">
                  <span
                    className={
                      "inline-flex size-7 items-center justify-center rounded-full font-mono text-xs font-semibold " +
                      (r.rank === 1
                        ? "bg-caramel-500 text-espresso-950"
                        : r.rank === 2
                          ? "bg-cream-200 text-espresso-800"
                          : r.rank === 3
                            ? "bg-clay-200 text-clay-800"
                            : "bg-cream-100 text-fg-muted")
                    }
                  >
                    {r.rank}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-fg">{r.name}</p>
                  <p className="font-mono text-[10px] text-fg-subtle">{r.sku}</p>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <Badge variant="neutral" size="sm">
                    {r.category}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                  {r.unitsSold}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm font-semibold tabular-nums text-espresso-900">
                  {formatCurrency(r.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-cream-50/50 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-cream-100 text-fg-subtle">
        <Package className="size-5" />
      </div>
      <p className="text-sm font-medium text-fg">No sales yet</p>
      <p className="text-xs text-fg-muted">
        Complete a sale and top products will appear here.
      </p>
    </div>
  );
}
