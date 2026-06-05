import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";

import { createTRPCRouter, managerProcedure } from "~/server/api/trpc";

/* ------------------------------------------------------------------
 * Report Router
 *
 * Manager+ analytics. Each procedure accepts a `range` (7d / 30d /
 * 90d / all) and returns aggregations ready to drop into charts.
 *
 * Conventions:
 *   - Revenue = sale.total (after discount)
 *   - COGS    = sum(saleItem.unitCost * saleItem.qty)
 *   - Profit  = revenue - COGS (per sale or per item)
 *   - Status filter is COMPLETED + REFUNDED (so refund impact
 *     shows up in the refund KPI but not the main revenue chart).
 *   - All DateTime keys use UTC day boundaries.
 * ------------------------------------------------------------------ */

const rangeInput = z.enum(["7d", "30d", "90d", "all"]).default("30d");

function rangeStart(range: "7d" | "30d" | "90d" | "all"): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

function makeDateBuckets(days: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

const saleWhereFromRange = (
  range: "7d" | "30d" | "90d" | "all",
  extra?: Prisma.SaleWhereInput,
): Prisma.SaleWhereInput => {
  const start = rangeStart(range);
  return {
    ...extra,
    ...(start ? { createdAt: { gte: start } } : {}),
  };
};

export const reportRouter = createTRPCRouter({
  /**
   * Top-level KPIs over the range. Returns revenue, cost, profit,
   * margin, transaction count, item count, average ticket, plus
   * refund totals.
   */
  summary: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const whereCompleted = saleWhereFromRange(input.range, { status: "COMPLETED" });
      const whereRefunded = saleWhereFromRange(input.range, { status: "REFUNDED" });

      const [agg, refundAgg, lineCosts] = await Promise.all([
        ctx.db.sale.aggregate({
          where: whereCompleted,
          _sum: { total: true, discount: true, tax: true },
          _count: { _all: true },
          _avg: { total: true },
        }),
        ctx.db.sale.aggregate({
          where: whereRefunded,
          _sum: { total: true },
          _count: { _all: true },
        }),
        // Pull line costs once — used for both itemsSold + COGS.
        ctx.db.saleItem.findMany({
          where: { sale: whereCompleted },
          select: { unitCost: true, qty: true },
        }),
      ]);

      const revenue = Number(agg._sum.total ?? 0);
      const discount = Number(agg._sum.discount ?? 0);
      const tax = Number(agg._sum.tax ?? 0);
      const itemsSold = lineCosts.reduce((s, l) => s + l.qty, 0);
      const cogs = lineCosts.reduce(
        (s, l) => s + Number(l.unitCost) * l.qty,
        0,
      );
      const profit = revenue - cogs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const avgTicket = agg._avg.total ? Number(agg._avg.total) : 0;

      return {
        revenue: round2(revenue),
        discount: round2(discount),
        tax: round2(tax),
        cogs: round2(cogs),
        profit: round2(profit),
        margin: round2(margin),
        transactions: agg._count._all,
        itemsSold,
        avgTicket: round2(avgTicket),
        refunds: {
          count: refundAgg._count._all,
          amount: round2(Number(refundAgg._sum.total ?? 0)),
        },
      };
    }),

  /**
   * Daily revenue + profit + transaction count. Returns one row per
   * day in the range, with zero-filled gaps.
   */
  salesByDay: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const start = rangeStart(input.range);
      if (!start) {
        // For "all", use a sensible cap (180 days) to keep response
        // size reasonable. The user can re-derive true all-time in
        // SQL if they need it.
        const cap = new Date();
        cap.setUTCDate(cap.getUTCDate() - 180);
        cap.setUTCHours(0, 0, 0, 0);
        return bucketSales(ctx, cap, 180);
      }
      const days = input.range === "7d" ? 7 : input.range === "30d" ? 30 : 90;
      return bucketSales(ctx, start, days);
    }),

  /**
   * Top N products by revenue (and second view by units sold).
   */
  topProducts: managerProcedure
    .input(
      z.object({
        range: rangeInput,
        limit: z.number().int().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = saleWhereFromRange(input.range, { status: "COMPLETED" });

      const [byRevenue, byQty] = await Promise.all([
        ctx.db.saleItem.groupBy({
          by: ["productId"],
          where: { sale: where },
          _sum: { qty: true, lineTotal: true, unitCost: true },
          orderBy: { _sum: { lineTotal: "desc" } },
          take: input.limit,
        }),
        ctx.db.saleItem.groupBy({
          by: ["productId"],
          where: { sale: where },
          _sum: { qty: true },
          orderBy: { _sum: { qty: "desc" } },
          take: input.limit,
        }),
      ]);

      const productIds = Array.from(
        new Set([...byRevenue.map((r) => r.productId), ...byQty.map((r) => r.productId)]),
      );
      const [products, lineCosts] = await Promise.all([
        ctx.db.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { id: true, name: true, color: true } },
          },
        }),
        // Pull per-line costs to compute true COGS (sum of unitCost*qty
        // per product). Prisma groupBy can only sum individual fields.
        ctx.db.saleItem.findMany({
          where: { sale: where, productId: { in: productIds } },
          select: { productId: true, unitCost: true, qty: true },
        }),
      ]);
      const byId = new Map(products.map((p) => [p.id, p]));
      const cogsByProduct = new Map<string, number>();
      for (const l of lineCosts) {
        cogsByProduct.set(
          l.productId,
          (cogsByProduct.get(l.productId) ?? 0) + Number(l.unitCost) * l.qty,
        );
      }

      return {
        byRevenue: byRevenue.map((r, idx) => ({
          rank: idx + 1,
          productId: r.productId,
          name: byId.get(r.productId)?.name ?? "Unknown",
          sku: byId.get(r.productId)?.sku ?? "—",
          category: byId.get(r.productId)?.category.name ?? "—",
          categoryColor: byId.get(r.productId)?.category.color ?? null,
          unitsSold: r._sum.qty ?? 0,
          revenue: round2(Number(r._sum.lineTotal ?? 0)),
          cogs: round2(cogsByProduct.get(r.productId) ?? 0),
        })),
        byQty: byQty.map((r, idx) => ({
          rank: idx + 1,
          productId: r.productId,
          name: byId.get(r.productId)?.name ?? "Unknown",
          sku: byId.get(r.productId)?.sku ?? "—",
          unitsSold: r._sum.qty ?? 0,
        })),
      };
    }),

  /**
   * Revenue by payment method (cash / card / e-wallet).
   */
  paymentBreakdown: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const where = saleWhereFromRange(input.range, { status: "COMPLETED" });
      const groups = await ctx.db.sale.groupBy({
        by: ["paymentMethod"],
        where,
        _sum: { total: true },
        _count: { _all: true },
      });
      const total = groups.reduce((s, g) => s + Number(g._sum.total ?? 0), 0);
      return groups
        .map((g) => ({
          method: g.paymentMethod,
          revenue: round2(Number(g._sum.total ?? 0)),
          count: g._count._all,
          share: total > 0 ? round2((Number(g._sum.total ?? 0) / total) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    }),

  /**
   * Revenue by category.
   */
  categoryBreakdown: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const where = saleWhereFromRange(input.range, { status: "COMPLETED" });
      // Need productId -> categoryId mapping
      const products = await ctx.db.product.findMany({
        select: { id: true, categoryId: true, category: { select: { id: true, name: true, color: true } } },
      });
      const productCategory = new Map(
        products.map((p) => [p.id, p.category] as const),
      );
      const categories = new Map(
        products.map((p) => [p.categoryId, p.category] as const),
      );

      // Group by product to get revenue + units per product, then pull
      // per-line costs to compute true COGS (sum of unitCost*qty per
      // category, not unitCost_sum * qty_sum).
      const groups = await ctx.db.saleItem.groupBy({
        by: ["productId"],
        where: { sale: where },
        _sum: { lineTotal: true, qty: true },
      });
      const lineCosts = await ctx.db.saleItem.findMany({
        where: { sale: where },
        select: { productId: true, unitCost: true, qty: true },
      });
      const cogsByProduct = new Map<string, number>();
      for (const l of lineCosts) {
        cogsByProduct.set(
          l.productId,
          (cogsByProduct.get(l.productId) ?? 0) + Number(l.unitCost) * l.qty,
        );
      }

      const agg = new Map<string, { name: string; color: string | null; revenue: number; units: number; cogs: number }>();
      for (const g of groups) {
        const cat = productCategory.get(g.productId);
        if (!cat) continue;
        const cur = agg.get(cat.id) ?? {
          name: cat.name,
          color: cat.color,
          revenue: 0,
          units: 0,
          cogs: 0,
        };
        cur.revenue += Number(g._sum.lineTotal ?? 0);
        cur.units += g._sum.qty ?? 0;
        cur.cogs += cogsByProduct.get(g.productId) ?? 0;
        agg.set(cat.id, cur);
      }
      // Make sure every category appears (even with zero sales).
      for (const [id, c] of categories) {
        if (!agg.has(id)) {
          agg.set(id, { name: c.name, color: c.color, revenue: 0, units: 0, cogs: 0 });
        }
      }

      const total = Array.from(agg.values()).reduce((s, v) => s + v.revenue, 0);
      return Array.from(agg.entries())
        .map(([id, v]) => ({
          categoryId: id,
          name: v.name,
          color: v.color,
          revenue: round2(v.revenue),
          units: v.units,
          cogs: round2(v.cogs),
          profit: round2(v.revenue - v.cogs),
          share: total > 0 ? round2((v.revenue / total) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    }),

  /**
   * Sales by hour-of-day (0–23) over the range. Shows peak hours.
   */
  hourlyHeatmap: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const where = saleWhereFromRange(input.range, { status: "COMPLETED" });
      const sales = await ctx.db.sale.findMany({
        where,
        select: { total: true, createdAt: true },
      });
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`,
        revenue: 0,
        transactions: 0,
      }));
      for (const s of sales) {
        const h = s.createdAt.getUTCHours();
        const b = buckets[h];
        if (b) {
          b.revenue += Number(s.total);
          b.transactions += 1;
        }
      }
      return buckets.map((b) => ({
        ...b,
        revenue: round2(b.revenue),
      }));
    }),

  /**
   * Cashier leaderboard — revenue + transactions + items sold per
   * cashier, ranked.
   */
  cashierLeaderboard: managerProcedure
    .input(z.object({ range: rangeInput }))
    .query(async ({ ctx, input }) => {
      const where = saleWhereFromRange(input.range, { status: "COMPLETED" });
      const groups = await ctx.db.sale.groupBy({
        by: ["cashierId"],
        where,
        _sum: { total: true },
        _count: { _all: true },
      });
      const [users, sales] = await Promise.all([
        ctx.db.user.findMany({
          where: { id: { in: groups.map((g) => g.cashierId) } },
          select: { id: true, name: true, role: true },
        }),
        ctx.db.sale.findMany({
          where,
          select: {
            id: true,
            cashierId: true,
            items: { select: { qty: true } },
          },
        }),
      ]);
      const byId = new Map(users.map((u) => [u.id, u]));

      const itemsByCashier = new Map<string, number>();
      for (const s of sales) {
        const total = s.items.reduce((sum, i) => sum + i.qty, 0);
        itemsByCashier.set(s.cashierId, (itemsByCashier.get(s.cashierId) ?? 0) + total);
      }

      const total = groups.reduce((s, g) => s + Number(g._sum.total ?? 0), 0);
      const rows = groups.map((g) => {
        const u = byId.get(g.cashierId);
        const revenue = Number(g._sum.total ?? 0);
        return {
          cashierId: g.cashierId,
          name: u?.name ?? "Unknown",
          role: u?.role ?? "CASHIER",
          revenue: round2(revenue),
          transactions: g._count._all,
          itemsSold: itemsByCashier.get(g.cashierId) ?? 0,
          avgTicket: g._count._all > 0 ? round2(revenue / g._count._all) : 0,
          share: total > 0 ? round2((revenue / total) * 100) : 0,
        };
      });
      return rows
        .sort((a, b) => b.revenue - a.revenue)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));
    }),
});

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type CtxShape = {
  db: Prisma.TransactionClient;
};

async function bucketSales(
  ctx: CtxShape,
  start: Date,
  days: number,
) {
  const keys = makeDateBuckets(days);
  const buckets = new Map(
    keys.map((k) => [k, { date: k, revenue: 0, profit: 0, transactions: 0, itemsSold: 0 }]),
  );
  const sales = await ctx.db.sale.findMany({
    where: { createdAt: { gte: start }, status: "COMPLETED" },
    select: {
      total: true,
      createdAt: true,
      items: { select: { unitCost: true, qty: true } },
    },
  });
  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    const revenue = Number(s.total);
    const cogs = s.items.reduce(
      (sum: number, i: { unitCost: unknown; qty: number }) => sum + Number(i.unitCost) * i.qty,
      0,
    );
    b.revenue += revenue;
    b.profit += revenue - cogs;
    b.transactions += 1;
    b.itemsSold += s.items.reduce((sum: number, i: { qty: number }) => sum + i.qty, 0);
  }
  return Array.from(buckets.values()).map((b) => ({
    date: b.date,
    revenue: round2(b.revenue),
    profit: round2(b.profit),
    transactions: b.transactions,
    itemsSold: b.itemsSold,
  }));
}
