import { AlertTriangle, Boxes, CheckCircle2, Package, X } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { StockToolbar } from "~/components/stock/stock-toolbar";
import { StockTable } from "~/components/stock/stock-table";
import { RecentMovements } from "~/components/stock/recent-movements";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Stock · Kapabara",
};

type SearchParams = Promise<{
  search?: string;
  categoryId?: string;
  stockStatus?: string;
  sortBy?: string;
  sortDir?: string;
  page?: string;
}>;

export default async function StockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("MANAGER");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") ?? 1);

  const [initialData, categories, summary, movements] = await Promise.all([
    api.stock.list({
      search: sp.search ?? undefined,
      categoryId: sp.categoryId ?? undefined,
      stockStatus: (sp.stockStatus as
        | "ALL" | "OK" | "LOW" | "OUT" | "TRACK_OFF"
        | undefined) ?? "ALL",
      sortBy: (sp.sortBy as
        | "name" | "sku" | "product" | "stock" | "threshold" | "updated"
        | undefined) ?? "stock",
      sortDir: (sp.sortDir as "asc" | "desc" | undefined) ?? "asc",
      page,
      pageSize: 25,
    }),
    api.product.categories(),
    api.stock.summary(),
    api.stock.movements({ limit: 12 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase C3 · Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Stock
          </h1>
          <p className="mt-1 text-fg-muted">
            <strong className="text-fg">{summary.total}</strong> tracked variants
            {" · "}
            <strong className={summary.out > 0 ? "text-red-700" : "text-fg"}>
              {summary.out} out
            </strong>
            {summary.low > 0 && (
              <>
                {" · "}
                <strong className="text-clay-700">{summary.low} low</strong>
              </>
            )}
            {summary.healthy > 0 && (
              <>
                {" · "}
                <strong className="text-sage-700">{summary.healthy} healthy</strong>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total variants"
          value={summary.total.toString()}
          icon={Boxes}
          tone="default"
        />
        <StatCard
          label="Out of stock"
          value={summary.out.toString()}
          icon={X}
          tone={summary.out > 0 ? "danger" : "sage"}
        />
        <StatCard
          label="Low stock"
          value={summary.low.toString()}
          icon={AlertTriangle}
          tone={summary.low > 0 ? "warn" : "sage"}
        />
        <StatCard
          label="Units on hand"
          value={summary.totalUnits.toLocaleString()}
          icon={Package}
          tone="default"
        />
      </section>

      {/* Toolbar */}
      <StockToolbar
        categories={categories}
        total={initialData.total}
        filters={{ lowCount: summary.low, outCount: summary.out }}
      />

      {/* Table + recent activity */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]">
        <StockTable initialData={initialData} />
        <RecentMovements movements={movements} />
      </section>

      {/* Footnote */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-cream-50/40 p-4 text-sm text-fg-muted">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
          <CheckCircle2 className="size-4" />
        </div>
        <div>
          <p className="font-medium text-fg">Stock movements are logged</p>
          <p className="mt-0.5">
            Every adjustment creates an audit row tied to your account.
            Use the export button to pull a CSV for accounting or suppliers.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "sage" | "warn" | "danger";
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
        className={`mt-2 font-display text-2xl tabular-nums ${
          tone === "sage"
            ? "text-sage-700"
            : tone === "warn"
              ? "text-clay-700"
              : tone === "danger"
                ? "text-red-700"
                : "text-espresso-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
