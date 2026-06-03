import Link from "next/link";
import { AlertTriangle, ArrowRight, Package } from "lucide-react";

import { cn } from "~/lib/utils";

type Item = {
  id: string;
  productId: string;
  name: string;
  productName: string;
  sku: string;
  stock: number;
  threshold: number;
};

export function LowStockWidget({ items }: { items: Item[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            Inventory · low stock
          </p>
          <p className="mt-1 font-display text-lg text-espresso-900">
            {items.length === 0
              ? "Everything's stocked"
              : `${items.length} item${items.length === 1 ? "" : "s"} need restock`}
          </p>
        </div>
        <Link
          href="/stock?filter=low"
          className="text-sm font-medium text-caramel-700 hover:underline"
        >
          Manage stock →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-sage-50 px-6 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">
            <Package className="size-5" />
          </div>
          <p className="text-sm font-medium text-sage-800">Stock is healthy</p>
          <p className="text-xs text-sage-700/70">
            Nothing at or below threshold right now.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const critical = it.stock === 0;
            const ratio = it.threshold > 0 ? it.stock / it.threshold : 0;
            return (
              <li key={it.id}>
                <Link
                  href="/stock?filter=low"
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-cream-50/40"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      critical
                        ? "bg-red-100 text-red-700"
                        : ratio < 0.5
                          ? "bg-clay-100 text-clay-700"
                          : "bg-caramel-100 text-caramel-700",
                    )}
                  >
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {it.productName}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      {it.name} · {it.sku}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-mono text-base font-semibold tabular-nums",
                        critical
                          ? "text-red-700"
                          : ratio < 0.5
                            ? "text-clay-700"
                            : "text-fg",
                      )}
                    >
                      {it.stock}
                    </p>
                    <p className="font-mono text-[10px] text-fg-subtle">
                      of {it.threshold}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
