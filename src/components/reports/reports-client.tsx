"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Clock, Package, TrendingUp, Users, Wallet } from "lucide-react";

import { api } from "~/trpc/react";
import { ReportsToolbar } from "~/components/reports/reports-toolbar";
import { ReportsKpiStrip } from "~/components/reports/reports-kpi-strip";
import { RevenueProfitChart } from "~/components/reports/revenue-profit-chart";
import { TopProductsTable } from "~/components/reports/top-products-table";
import { PaymentBreakdown } from "~/components/reports/payment-breakdown";
import { CategoryBreakdown } from "~/components/reports/category-breakdown";
import { HourlyHeatmap } from "~/components/reports/hourly-heatmap";
import { CashierLeaderboard } from "~/components/reports/cashier-leaderboard";

export function ReportsClient({
  range,
}: {
  range: "7d" | "30d" | "90d" | "all";
}) {
  const router = useRouter();
  const [params, setParams] = React.useState<URLSearchParams>(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
  );

  // Sync external range prop changes
  React.useEffect(() => {
    setParams(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""));
  }, [range]);

  const summary = api.report.summary.useQuery({ range });
  const salesByDay = api.report.salesByDay.useQuery({ range });
  const topProducts = api.report.topProducts.useQuery({ range, limit: 10 });
  const payment = api.report.paymentBreakdown.useQuery({ range });
  const category = api.report.categoryBreakdown.useQuery({ range });
  const hourly = api.report.hourlyHeatmap.useQuery({ range });
  const leaderboard = api.report.cashierLeaderboard.useQuery({ range });

  function updateRange(next: "7d" | "30d" | "90d" | "all") {
    const url = new URLSearchParams(params.toString());
    url.set("range", next);
    setParams(url);
    router.replace(`/reports?${url.toString()}`, { scroll: false });
  }

  const isLoading =
    summary.isLoading ||
    salesByDay.isLoading ||
    topProducts.isLoading ||
    payment.isLoading ||
    category.isLoading ||
    hourly.isLoading ||
    leaderboard.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase E1 · Insights
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Reports
          </h1>
          <p className="mt-1 text-fg-muted">
            Revenue, profit, and operations across{" "}
            <strong className="text-fg">{rangeLabel(range)}</strong>.
          </p>
        </div>
        <ReportsToolbar value={range} onChange={updateRange} />
      </section>

      {/* KPI strip */}
      <ReportsKpiStrip
        summary={summary.data}
        isLoading={summary.isLoading}
      />

      {/* Revenue + profit chart */}
      <section className="card p-5">
        <SectionHeader
          icon={TrendingUp}
          title="Revenue & profit"
          subtitle="Daily revenue and gross profit over the selected range"
        />
        <RevenueProfitChart
          data={salesByDay.data ?? []}
          isLoading={salesByDay.isLoading}
        />
      </section>

      {/* Top products + payment breakdown */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <SectionHeader
            icon={Package}
            title="Top products"
            subtitle="Best sellers by revenue, with units sold and margin"
          />
          <TopProductsTable
            data={topProducts.data?.byRevenue ?? []}
            isLoading={topProducts.isLoading}
          />
        </div>
        <div className="card p-5">
          <SectionHeader
            icon={Wallet}
            title="Payment methods"
            subtitle="How customers paid"
          />
          <PaymentBreakdown
            data={payment.data ?? []}
            isLoading={payment.isLoading}
          />
        </div>
      </section>

      {/* Category + hourly */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <SectionHeader
            icon={BarChart3}
            title="Category performance"
            subtitle="Revenue and profit by category"
          />
          <CategoryBreakdown
            data={category.data ?? []}
            isLoading={category.isLoading}
          />
        </div>
        <div className="card p-5">
          <SectionHeader
            icon={Clock}
            title="Peak hours"
            subtitle="When the café is busiest (UTC)"
          />
          <HourlyHeatmap
            data={hourly.data ?? []}
            isLoading={hourly.isLoading}
          />
        </div>
      </section>

      {/* Cashier leaderboard */}
      <section className="card p-5">
        <SectionHeader
          icon={Users}
          title="Cashier leaderboard"
          subtitle="Revenue, transactions, and avg ticket per cashier"
        />
        <CashierLeaderboard
          data={leaderboard.data ?? []}
          isLoading={leaderboard.isLoading}
        />
      </section>

      {isLoading && (
        <p className="text-center text-xs text-fg-subtle">
          Loading reports…
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-caramel-100 text-espresso-900">
        <Icon className="size-4" />
      </div>
      <div>
        <h2 className="font-display text-lg font-medium text-espresso-900">{title}</h2>
        <p className="text-xs text-fg-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function rangeLabel(r: "7d" | "30d" | "90d" | "all"): string {
  if (r === "7d") return "the last 7 days";
  if (r === "30d") return "the last 30 days";
  if (r === "90d") return "the last 90 days";
  return "all time";
}
