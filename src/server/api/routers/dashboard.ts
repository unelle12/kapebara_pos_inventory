import { z } from "zod";

import {
  createTRPCRouter,
  managerProcedure,
  publicProcedure,
} from "~/server/api/trpc";

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

/** Start of "today" in UTC (matches the seeded timestamps). */
function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function startOfYesterdayUtc() {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}
function startOfDaysAgoUtc(days: number) {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/* ------------------------------------------------------------------
   Router
   ------------------------------------------------------------------ */

export const dashboardRouter = createTRPCRouter({
  /* ---- shell (cashier-safe) ---- */

  lowStockCount: publicProcedure.query(async ({ ctx }) => {
    const variants = await ctx.db.productVariant.findMany({
      where: { active: true, product: { active: true, trackStock: true } },
      select: { id: true, stock: true, product: { select: { lowStockThreshold: true } } },
    });
    return variants.filter((v) => v.stock <= v.product.lowStockThreshold).length;
  }),

  recentSalesCount: publicProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return ctx.db.sale.count({ where: { createdAt: { gte: since } } });
  }),

  /* ---- full KPIs (manager+) ---- */

  kpis: managerProcedure.query(async ({ ctx }) => {
    const todayStart = startOfTodayUtc();
    const yestStart = startOfYesterdayUtc();
    const yestEnd = todayStart;

    const [todayAgg, yestAgg, lowStockVariants] = await Promise.all([
      ctx.db.sale.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: { createdAt: { gte: todayStart }, status: "COMPLETED" },
      }),
      ctx.db.sale.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: {
          createdAt: { gte: yestStart, lt: yestEnd },
          status: "COMPLETED",
        },
      }),
      ctx.db.productVariant.findMany({
        where: { active: true, product: { active: true, trackStock: true } },
        select: { id: true, stock: true, product: { select: { lowStockThreshold: true } } },
      }),
    ]);

    // Items sold today
    const todayItemsAgg = await ctx.db.saleItem.aggregate({
      _sum: { qty: true },
      where: { sale: { createdAt: { gte: todayStart }, status: "COMPLETED" } },
    });

    const todayRevenue = Number(todayAgg._sum.total ?? 0);
    const todayTx = todayAgg._count._all;
    const yestRevenue = Number(yestAgg._sum.total ?? 0);
    const yestTx = yestAgg._count._all;
    const todayItems = Number(todayItemsAgg._sum.qty ?? 0);
    const avgTicket = todayTx > 0 ? todayRevenue / todayTx : 0;
    const lowStockCount = lowStockVariants.filter(
      (v) => v.stock <= v.product.lowStockThreshold,
    ).length;

    return {
      todayRevenue,
      todayTx,
      todayItems,
      avgTicket,
      lowStockCount,
      // deltas vs yesterday
      revenueDelta: yestRevenue > 0 ? ((todayRevenue - yestRevenue) / yestRevenue) * 100 : null,
      txDelta: yestTx > 0 ? ((todayTx - yestTx) / yestTx) * 100 : null,
    };
  }),

  /* ---- 7-day sales chart ---- */

  salesByDay: managerProcedure
    .input(z.object({ days: z.number().int().min(2).max(60).default(7) }))
    .query(async ({ ctx, input }) => {
      const since = startOfDaysAgoUtc(input.days - 1);
      const sales = await ctx.db.sale.findMany({
        where: { createdAt: { gte: since }, status: "COMPLETED" },
        select: { total: true, createdAt: true },
      });

      // Bucket by UTC day
      const buckets = new Map<string, { revenue: number; transactions: number }>();
      for (let i = 0; i < input.days; i++) {
        const d = startOfDaysAgoUtc(input.days - 1 - i);
        buckets.set(d.toISOString().slice(0, 10), { revenue: 0, transactions: 0 });
      }
      for (const s of sales) {
        const key = s.createdAt.toISOString().slice(0, 10);
        const b = buckets.get(key);
        if (b) {
          b.revenue += Number(s.total);
          b.transactions += 1;
        }
      }
      return Array.from(buckets.entries()).map(([date, v]) => ({
        date,
        revenue: Math.round(v.revenue * 100) / 100,
        transactions: v.transactions,
      }));
    }),

  /* ---- top products ---- */

  topProducts: managerProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(20).default(5),
          days: z.number().int().min(1).max(90).default(30),
        })
        .default({ limit: 5, days: 30 }),
    )
    .query(async ({ ctx, input }) => {
      const since = startOfDaysAgoUtc(input.days - 1);
      const items = await ctx.db.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { createdAt: { gte: since }, status: "COMPLETED" } },
        _sum: { qty: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: input.limit,
      });
      const products = await ctx.db.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
        select: { id: true, name: true, sku: true, category: { select: { name: true } } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      return items.map((i, idx) => ({
        rank: idx + 1,
        productId: i.productId,
        name: byId.get(i.productId)?.name ?? "Unknown",
        sku: byId.get(i.productId)?.sku ?? "—",
        category: byId.get(i.productId)?.category.name ?? "—",
        unitsSold: i._sum.qty ?? 0,
        revenue: Math.round(Number(i._sum.lineTotal ?? 0) * 100) / 100,
      }));
    }),

  /* ---- low-stock list (full, for dashboard widget) ---- */

  lowStockList: managerProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(8) }).default({ limit: 8 }))
    .query(async ({ ctx, input }) => {
      const variants = await ctx.db.productVariant.findMany({
        where: { active: true, product: { active: true, trackStock: true } },
        include: { product: { select: { name: true, sku: true, lowStockThreshold: true } } },
        orderBy: { stock: "asc" },
        take: input.limit * 3,
      });
      return variants
        .filter((v) => v.stock <= v.product.lowStockThreshold)
        .slice(0, input.limit)
        .map((v) => ({
          id: v.id,
          productId: v.productId,
          name: v.name,
          productName: v.product.name,
          sku: v.sku,
          stock: v.stock,
          threshold: v.product.lowStockThreshold,
        }));
    }),
});
