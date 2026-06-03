import { Coffee, Hash, Receipt, ShoppingBag, Wallet } from "lucide-react";

import { requireUser } from "~/lib/auth-helpers";
import { hasRole, ROLE_LABELS } from "~/lib/permissions";
import { formatCurrency } from "~/lib/utils";
import { KpiCard } from "~/components/dashboard/kpi-card";
import { SalesChart } from "~/components/dashboard/sales-chart";
import { TopProducts } from "~/components/dashboard/top-products";
import { LowStockWidget } from "~/components/dashboard/low-stock-widget";
import { QuickActions, ManagerOnlyCta } from "~/components/dashboard/quick-actions";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireUser();
  const { name, role } = session.user;
  const firstName = name?.split(" ")[0] ?? "friend";
  const isManager = hasRole(role, "MANAGER");

  // Manager+ queries
  const [kpis, salesByDay, topProducts, lowStockList] = isManager
    ? await Promise.all([
        api.dashboard.kpis(),
        api.dashboard.salesByDay({ days: 7 }),
        api.dashboard.topProducts({ limit: 5, days: 30 }),
        api.dashboard.lowStockList({ limit: 6 }),
      ])
    : [null, null, null, null];

  const totalRevenue7d = (salesByDay ?? []).reduce((s, d) => s + d.revenue, 0);
  const totalTx7d = (salesByDay ?? []).reduce((s, d) => s + d.transactions, 0);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase B2 · Live dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Good {greeting()}, {firstName}.
          </h1>
          <p className="mt-1 text-fg-muted">
            Signed in as <strong className="text-fg">{ROLE_LABELS[role]}</strong>
            {isManager && <> · last 7 days: {formatCurrency(totalRevenue7d)} across {totalTx7d} transactions</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pos">
            <Button variant="primary" size="lg">
              <Coffee className="size-5" />
              Open the till
            </Button>
          </Link>
        </div>
      </section>

      {/* Manager+ KPIs */}
      {kpis && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Today's revenue"
            value={formatCurrency(kpis.todayRevenue)}
            icon={Wallet}
            tone="default"
            trend={
              kpis.revenueDelta !== null
                ? { value: kpis.revenueDelta, label: "vs yesterday" }
                : null
            }
          />
          <KpiCard
            label="Transactions"
            value={kpis.todayTx.toString()}
            icon={Receipt}
            tone="sage"
            hint={`${String(kpis.todayItems)} items sold`}
            trend={
              kpis.txDelta !== null
                ? { value: kpis.txDelta, label: "vs yesterday" }
                : null
            }
          />
          <KpiCard
            label="Avg. ticket"
            value={formatCurrency(kpis.avgTicket)}
            icon={ShoppingBag}
            tone="default"
            hint="today"
          />
          <KpiCard
            label="Low-stock items"
            value={kpis.lowStockCount.toString()}
            icon={Hash}
            tone={kpis.lowStockCount > 0 ? "warn" : "sage"}
            hint={kpis.lowStockCount > 0 ? "needs attention" : "all good"}
          />
        </section>
      )}

      {/* Chart + Low stock */}
      {salesByDay && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="card p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                  Sales · last 7 days
                </p>
                <p className="mt-1 font-display text-lg text-espresso-900">
                  Daily revenue
                </p>
              </div>
              <Link
                href="/reports"
                className="text-sm font-medium text-caramel-700 hover:underline"
              >
                Full reports →
              </Link>
            </div>
            <SalesChart data={salesByDay} />
          </div>
          <div className="card p-6">
            <LowStockWidget items={lowStockList ?? []} />
          </div>
        </section>
      )}

      {/* Top products + Quick actions */}
      {topProducts ? (
        <section className="card p-6">
          <TopProducts rows={topProducts} days={30} />
        </section>
      ) : (
        <section className="space-y-4">
          <ManagerOnlyCta role={role} />
          <QuickActions role={role} />
        </section>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
