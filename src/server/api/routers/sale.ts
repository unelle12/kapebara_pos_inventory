import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  managerProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { db as prismaDb } from "~/server/db";
import type { Prisma } from "../../../../generated/prisma";

/* ------------------------------------------------------------------
 * Sale Router
 *
 * Cashier-accessible checkout. The single `checkout` mutation does the
 * full atomic dance: validates prices, validates stock, generates a
 * reference, creates the Sale + SaleItems, decrements variant stock,
 * and logs a SALE stock movement — all in one Prisma transaction.
 * ------------------------------------------------------------------ */

const lineInput = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().nullable(),
  productName: z.string().min(1).max(120),
  variantName: z.string().min(1).max(80).nullable(),
  sku: z.string().min(1).max(40),
  qty: z.number().int().positive().max(999),
  unitPrice: z.number().nonnegative().max(999999.99),
});

const checkoutInput = z.object({
  lines: z.array(lineInput).min(1).max(100),
  discount: z.number().nonnegative().max(999999.99).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "EWALLET"]),
  amountTendered: z.number().nonnegative().max(999999.99).optional(),
  note: z.string().trim().max(200).optional(),
});

export const saleRouter = createTRPCRouter({
  /**
   * Atomic checkout: validate → generate reference → create Sale + items
   * → decrement stock → log SALE movement. Returns the persisted sale
   * for the receipt view.
   */
  checkout: protectedProcedure
    .input(checkoutInput)
    .mutation(async ({ ctx, input }) => {
      if (input.lines.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      const variantIds = input.lines
        .map((l) => l.variantId)
        .filter((id): id is string => id !== null);
      const productIds = Array.from(new Set(input.lines.map((l) => l.productId)));

      const variants =
        variantIds.length > 0
          ? await ctx.db.productVariant.findMany({
              where: { id: { in: variantIds } },
              select: {
                id: true,
                productId: true,
                price: true,
                cost: true,
                stock: true,
                name: true,
                sku: true,
                product: { select: { name: true, sku: true, trackStock: true } },
              },
            })
          : [];

      const variantById = new Map(variants.map((v) => [v.id, v]));

      const products = await ctx.db.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          cost: true,
          trackStock: true,
        },
      });
      const productById = new Map(products.map((p) => [p.id, p]));

      // Validate + build sale lines in server-canonical form.
      const saleLines: Array<{
        productId: string;
        variantId: string | null;
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
        unitCost: number;
        lineTotal: number;
        stockDelta: number;
      }> = [];

      let subtotal = 0;
      for (const line of input.lines) {
        const product = productById.get(line.productId);
        if (!product) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product not found: ${line.productId}`,
          });
        }
        const variant = line.variantId ? variantById.get(line.variantId) : null;
        if (line.variantId && !variant) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Variant not found: ${line.variantId}`,
          });
        }

        // For variant lines the server price wins. For product-only lines
        // (rare) we trust the cashier-entered price.
        const canonicalPrice = variant
          ? Number(variant.price)
          : line.unitPrice;
        const unitCost = Number(variant?.cost ?? product.cost);
        const lineTotal = round2(canonicalPrice * line.qty);

        if (variant && product.trackStock && variant.stock < line.qty) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for ${product.name} (${variant.name}): have ${variant.stock}, need ${line.qty}`,
          });
        }

        saleLines.push({
          productId: product.id,
          variantId: variant?.id ?? null,
          name: variant ? `${product.name} (${variant.name})` : product.name,
          sku: variant?.sku ?? product.sku,
          qty: line.qty,
          unitPrice: canonicalPrice,
          unitCost,
          lineTotal,
          stockDelta: -line.qty,
        });
        subtotal += lineTotal;
      }

      if (input.discount > subtotal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Discount cannot exceed subtotal",
        });
      }
      const total = round2(Math.max(0, subtotal - input.discount));

      if (input.paymentMethod === "CASH") {
        if (input.amountTendered === undefined || input.amountTendered < total) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cash tendered must cover the total",
          });
        }
      }
      const amountTendered =
        input.paymentMethod === "CASH" ? (input.amountTendered ?? total) : null;
      const change =
        input.paymentMethod === "CASH" && amountTendered !== null
          ? round2(amountTendered - total)
          : null;

      const reference = await generateReference();

      // Persist atomically.
      const sale = await ctx.db.$transaction(async (tx) => {
        const created = await tx.sale.create({
          data: {
            reference,
            status: "COMPLETED",
            subtotal: round2(subtotal),
            tax: 0,
            discount: round2(input.discount),
            total,
            paymentMethod: input.paymentMethod,
            amountTendered,
            change,
            cashierId: ctx.session.user.id,
            note: input.note ?? null,
            items: {
              create: saleLines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                name: l.name,
                sku: l.sku,
                qty: l.qty,
                unitPrice: l.unitPrice,
                unitCost: l.unitCost,
                lineTotal: l.lineTotal,
              })),
            },
          },
          select: {
            id: true,
            reference: true,
            total: true,
            change: true,
            paymentMethod: true,
            amountTendered: true,
            subtotal: true,
            discount: true,
            createdAt: true,
            cashier: { select: { name: true } },
            items: {
              select: {
                id: true,
                name: true,
                sku: true,
                qty: true,
                unitPrice: true,
                lineTotal: true,
              },
            },
          },
        });

        // Decrement stock + log SALE movement per line.
        for (const line of saleLines) {
          if (line.variantId) {
            await tx.productVariant.update({
              where: { id: line.variantId },
              data: { stock: { increment: line.stockDelta } },
            });
            await tx.stockMovement.create({
              data: {
                variantId: line.variantId,
                productId: line.productId,
                type: "SALE",
                qty: line.stockDelta,
                note: `Sale ${reference}`,
                userId: ctx.session.user.id,
              },
            });
          }
        }

        return created;
      });

      return sale;
    }),

  /**
   * Most recent sales (cashier-readable) for the "recent receipts" UI.
   */
  recent: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sale.findMany({
        take: input.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          total: true,
          paymentMethod: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      });
    }),

  /**
   * Paginated sale list for the sales history page (manager+).
   * Filters: search (by reference), cashier, paymentMethod, status,
   * date range, and a free date preset. Returns the same shape as
   * `stock.list` so we can reuse the table pagination UI.
   */
  list: managerProcedure
    .input(
      z.object({
        search: z.string().trim().max(60).optional(),
        cashierId: z.string().cuid().optional(),
        paymentMethod: z
          .enum(["CASH", "CARD", "EWALLET", "ALL"])
          .default("ALL"),
        status: z
          .enum(["COMPLETED", "REFUNDED", "VOID", "ALL"])
          .default("ALL"),
        range: z
          .enum(["today", "week", "month", "quarter", "all"])
          .default("month"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.SaleWhereInput = {};

      if (input.search) {
        where.reference = { contains: input.search, mode: "insensitive" };
      }
      if (input.cashierId) where.cashierId = input.cashierId;
      if (input.paymentMethod !== "ALL") {
        where.paymentMethod = input.paymentMethod;
      }
      if (input.status !== "ALL") where.status = input.status;

      const dateFilter = computeRange(input.range);
      if (dateFilter) where.createdAt = dateFilter;

      const [total, items] = await Promise.all([
        ctx.db.sale.count({ where }),
        ctx.db.sale.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
          select: {
            id: true,
            reference: true,
            status: true,
            total: true,
            discount: true,
            paymentMethod: true,
            createdAt: true,
            cashier: { select: { id: true, name: true } },
            _count: { select: { items: true, refunds: true } },
          },
        }),
      ]);

      // Aggregate summary (for header KPIs) over the same filter.
      const aggregate = await ctx.db.sale.aggregate({
        where,
        _sum: { total: true, discount: true },
        _count: { _all: true },
      });

      return {
        items: items.map((s) => ({
          ...s,
          total: Number(s.total),
          discount: Number(s.discount),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
        pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
        summary: {
          revenue: Number(aggregate._sum.total ?? 0),
          discount: Number(aggregate._sum.discount ?? 0),
          count: aggregate._count._all,
        },
      };
    }),

  /**
   * Full sale detail (manager+): items, cashier, refunds. Used by
   * the sale detail dialog and the refund flow.
   */
  byId: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const sale = await ctx.db.sale.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          reference: true,
          status: true,
          subtotal: true,
          tax: true,
          discount: true,
          total: true,
          paymentMethod: true,
          amountTendered: true,
          change: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          cashier: { select: { id: true, name: true, email: true, role: true } },
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              name: true,
              sku: true,
              qty: true,
              unitPrice: true,
              unitCost: true,
              lineTotal: true,
            },
            orderBy: { id: "asc" },
          },
          refunds: {
            select: {
              id: true,
              reason: true,
              amount: true,
              createdAt: true,
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!sale) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" });
      }
      return {
        ...sale,
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        discount: Number(sale.discount),
        total: Number(sale.total),
        amountTendered:
          sale.amountTendered !== null ? Number(sale.amountTendered) : null,
        change: sale.change !== null ? Number(sale.change) : null,
        items: sale.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          unitCost: Number(i.unitCost),
          lineTotal: Number(i.lineTotal),
        })),
        refunds: sale.refunds.map((r) => ({
          ...r,
          amount: Number(r.amount),
        })),
      };
    }),

  /**
   * List of cashiers for the sales-history filter dropdown.
   */
  cashiers: managerProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { active: true, role: { in: ["CASHIER", "MANAGER", "OWNER"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    });
  }),

  /**
   * Refund a sale (manager+). Restores stock for each line, marks the
   * sale REFUNDED, and creates a Refund record + REFUND stock
   * movement per line. Atomic.
   *
   * Behavior:
   *   - Amount defaults to the full sale total (full refund).
   *   - Partial refunds (amount < total) are supported but do not
   *     restore stock proportionally — stock is returned in full
   *     when the sale is fully refunded, otherwise the cashier
   *     explicitly does not return the items (e.g. discount).
   *   - Re-refunding an already-refunded sale is rejected.
   */
  refund: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().trim().min(2).max(200),
        amount: z.number().nonnegative().max(999999.99).optional(),
        returnItems: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sale = await ctx.db.sale.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          total: true,
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              qty: true,
            },
          },
        },
      });
      if (!sale) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" });
      }
      if (sale.status === "REFUNDED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sale is already fully refunded",
        });
      }
      if (sale.status === "VOID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot refund a voided sale",
        });
      }

      const refundAmount = round2(input.amount ?? Number(sale.total));
      if (refundAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Refund amount must be positive",
        });
      }
      if (refundAmount > Number(sale.total)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Refund amount cannot exceed sale total",
        });
      }
      const isFullRefund = refundAmount >= Number(sale.total) - 0.005;
      const willReturnItems = isFullRefund && input.returnItems;

      const updated = await ctx.db.$transaction(async (tx) => {
        const refund = await tx.refund.create({
          data: {
            saleId: sale.id,
            reason: input.reason,
            amount: refundAmount,
            userId: ctx.session.user.id,
          },
          select: {
            id: true,
            reason: true,
            amount: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        });

        if (willReturnItems) {
          for (const item of sale.items) {
            if (!item.variantId) continue;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.qty } },
            });
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                productId: item.productId,
                type: "REFUND",
                qty: item.qty,
                note: `Refund for sale ${sale.id} (${input.reason})`,
                userId: ctx.session.user.id,
              },
            });
          }
        }

        const saleStatus = isFullRefund ? "REFUNDED" : sale.status;
        const updatedSale = await tx.sale.update({
          where: { id: sale.id },
          data: { status: saleStatus },
          select: {
            id: true,
            reference: true,
            status: true,
            total: true,
          },
        });

        return { refund, sale: updatedSale };
      });

      return {
        ...updated,
        refund: { ...updated.refund, amount: Number(updated.refund.amount) },
        sale: { ...updated.sale, total: Number(updated.sale.total) },
        returnedItems: willReturnItems,
      };
    }),
});

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function generateReference(): Promise<string> {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const startOfDay = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate()));
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todayCount = await prismaDb.sale.count({
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });
  const seq = String(todayCount + 1).padStart(4, "0");
  return `KP-${yyyy}${mm}${dd}-${seq}`;
}

/**
 * Map a date-range preset to a Prisma date filter. `null` = no filter
 * (all-time).
 */
function computeRange(
  range: "today" | "week" | "month" | "quarter" | "all",
): Prisma.DateTimeFilter | undefined {
  if (range === "all") return undefined;
  const now = new Date();
  const start = new Date(now);
  if (range === "today") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (range === "week") {
    start.setUTCDate(now.getUTCDate() - 7);
    start.setUTCHours(0, 0, 0, 0);
  } else if (range === "month") {
    start.setUTCDate(now.getUTCDate() - 30);
    start.setUTCHours(0, 0, 0, 0);
  } else if (range === "quarter") {
    start.setUTCDate(now.getUTCDate() - 90);
    start.setUTCHours(0, 0, 0, 0);
  }
  return { gte: start };
}
