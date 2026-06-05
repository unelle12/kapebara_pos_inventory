import Link from "next/link";
import { CreditCard, History, TrendingUp, Wallet } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { SalesToolbar } from "~/components/sales/sales-toolbar";
import { SalesTable } from "~/components/sales/sales-table";
import { CashierRecentSales } from "~/components/sales/cashier-recent-sales";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Sales History · Kapabara",
};

type SearchParams = Promise<{
  search?: string;
  cashierId?: string;
  paymentMethod?: string;
  status?: string;
  range?: string;
  page?: string;
}>;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Cashier+ can view the page. Manager+ get the full list with
  // filters & refund capability; cashiers get a read-only "today"
  // view of their own sales.
  const session = await requireRole("CASHIER");
  const isManager = session.user.role === "MANAGER" || session.user.role === "OWNER";

  if (!isManager) {
    return <CashierSalesView />;
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") ?? 1);
  const range = (sp.range as
    | "today" | "week" | "month" | "quarter" | "all"
    | undefined) ?? "month";

  const [initialData, cashiers] = await Promise.all([
    api.sale.list({
      search: sp.search ?? undefined,
      cashierId: sp.cashierId ?? undefined,
      paymentMethod: (sp.paymentMethod as
        | "CASH" | "CARD" | "EWALLET" | "ALL" | undefined) ?? "ALL",
      status: (sp.status as
        | "COMPLETED" | "REFUNDED" | "VOID" | "ALL" | undefined) ?? "ALL",
      range,
      page,
      pageSize: 25,
    }),
    api.sale.cashiers(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase D3 · Sales
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Sales History
          </h1>
          <p className="mt-1 text-fg-muted">
            <strong className="text-fg">{initialData.summary.count}</strong> sales
            {" · "}
            <strong className="text-sage-700">
              {formatPHP(initialData.summary.revenue)}
            </strong> revenue
            {initialData.summary.discount > 0 && (
              <>
                {" · "}
                <strong className="text-clay-700">
                  {formatPHP(initialData.summary.discount)} discount
                </strong>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sales"
          value={initialData.summary.count.toString()}
          icon={History}
          tone="default"
        />
        <StatCard
          label="Revenue"
          value={formatPHP(initialData.summary.revenue)}
          icon={TrendingUp}
          tone="sage"
        />
        <StatCard
          label="Avg. ticket"
          value={
            initialData.summary.count > 0
              ? formatPHP(initialData.summary.revenue / initialData.summary.count)
              : "—"
          }
          icon={Wallet}
          tone="default"
        />
        <StatCard
          label="Discounts"
          value={formatPHP(initialData.summary.discount)}
          icon={CreditCard}
          tone={initialData.summary.discount > 0 ? "warn" : "default"}
        />
      </section>

      {/* Toolbar */}
      <SalesToolbar cashiers={cashiers} total={initialData.total} />

      {/* Table */}
      <SalesTable initialData={initialData} />
    </div>
  );
}

function CashierSalesView() {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
          Phase D3 · Sales
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
          My Sales Today
        </h1>
        <p className="mt-1 text-fg-muted">
          Refunds and full history are available to managers.{" "}
          <Link className="underline" href="/pos">
            Open the Point of Sale
          </Link>{" "}
          to start a new sale.
        </p>
      </section>
      <CashierRecentSales />
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

function formatPHP(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
