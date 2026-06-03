import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, managerProcedure } from "~/server/api/trpc";

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   Router
   ------------------------------------------------------------------ */

export const stockRouter = createTRPCRouter({
  /**
   * Paginated, searchable, filterable list of every product variant with
   * its computed stock status. Manager+ only.
   */
  list: managerProcedure
    .input(
      z.object({
        search: z.string().trim().max(80).optional(),
        categoryId: z.string().cuid().optional(),
        productId: z.string().cuid().optional(),
        stockStatus: z
          .enum(["ALL", "OK", "LOW", "OUT", "TRACK_OFF"])
          .default("ALL"),
        sortBy: z
          .enum(["name", "sku", "product", "stock", "threshold", "updated"])
          .default("stock"),
        sortDir: z.enum(["asc", "desc"]).default("asc"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        search,
        categoryId,
        productId,
        stockStatus,
        sortBy,
        sortDir,
        page,
        pageSize,
      } = input;

      const where: Parameters<typeof ctx.db.productVariant.findMany>[0] extends infer T
        ? T extends { where?: infer W }
          ? W
          : never
        : never = {
        active: true,
      };

      if (productId) {
        where.productId = productId;
      }
      if (categoryId) {
        where.product = { categoryId };
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { product: { name: { contains: search, mode: "insensitive" } } },
          { product: { sku: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [rows, allActive, lastMovements] = await Promise.all([
        ctx.db.productVariant.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                trackStock: true,
                lowStockThreshold: true,
                active: true,
                category: { select: { id: true, name: true, color: true } },
                supplier: { select: { id: true, name: true } },
              },
            },
          },
        }),
        ctx.db.productVariant.count({ where: { active: true } }),
        // Most recent movement per variant, in one query
        ctx.db.stockMovement.findMany({
          where: { variantId: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1000,
          select: { id: true, variantId: true, type: true, qty: true, note: true, createdAt: true, user: { select: { name: true } } },
        }),
      ]);

      // Index last movements by variantId
      const lastByVariant = new Map<string, typeof lastMovements[number]>();
      for (const m of lastMovements) {
        if (m.variantId && !lastByVariant.has(m.variantId)) {
          lastByVariant.set(m.variantId, m);
        }
      }

      // Augment with stock status
      type Row = (typeof rows)[number] & {
        status: "OUT" | "LOW" | "OK" | "TRACK_OFF";
        lastMovement: typeof lastMovements[number] | null;
      };

      const augmented: Row[] = rows.map((r) => {
        let status: Row["status"];
        if (!r.product.trackStock) status = "TRACK_OFF";
        else if (r.stock === 0) status = "OUT";
        else if (r.stock <= r.product.lowStockThreshold) status = "LOW";
        else status = "OK";

        return {
          ...r,
          status,
          lastMovement: lastByVariant.get(r.id) ?? null,
        };
      });

      // Stock-status filter
      const filtered =
        stockStatus === "ALL"
          ? augmented
          : augmented.filter((r) => r.status === stockStatus);

      // Sort
      const sorted = [...filtered].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortBy) {
          case "name":
            return (a.name.localeCompare(b.name)) * dir;
          case "sku":
            return a.sku.localeCompare(b.sku) * dir;
          case "product":
            return a.product.name.localeCompare(b.product.name) * dir;
          case "stock":
            return (a.stock - b.stock) * dir;
          case "threshold":
            return (a.product.lowStockThreshold - b.product.lowStockThreshold) * dir;
          case "updated":
            return (a.updatedAt.getTime() - b.updatedAt.getTime()) * dir;
        }
      });

      const total = sorted.length;
      const start = (page - 1) * pageSize;
      const items = sorted.slice(start, start + pageSize);

      return {
        items: items.map((r) => ({
          id: r.id,
          sku: r.sku,
          name: r.name,
          stock: r.stock,
          price: Number(r.price),
          cost: Number(r.cost),
          attributes: r.attributes,
          updatedAt: r.updatedAt,
          status: r.status,
          product: {
            id: r.product.id,
            name: r.product.name,
            sku: r.product.sku,
            trackStock: r.product.trackStock,
            lowStockThreshold: r.product.lowStockThreshold,
            active: r.product.active,
            category: r.product.category,
            supplier: r.product.supplier,
          },
          lastMovement: r.lastMovement
            ? {
                type: r.lastMovement.type,
                qty: r.lastMovement.qty,
                note: r.lastMovement.note,
                createdAt: r.lastMovement.createdAt,
                userName: r.lastMovement.user.name,
              }
            : null,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
        totalActive: allActive,
      };
    }),

  /**
   * Top-N low-stock items for the dashboard widget + notification bell.
   * This is the cheap, publicProcedure-friendly version.
   */
  lowStock: managerProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(8),
        })
        .default({ limit: 8 }),
    )
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

  /** Aggregated counts for the stock page header. */
  summary: managerProcedure.query(async ({ ctx }) => {
    const variants = await ctx.db.productVariant.findMany({
      where: { active: true, product: { active: true, trackStock: true } },
      select: { stock: true, product: { select: { lowStockThreshold: true } } },
    });
    let total = 0;
    let out = 0;
    let low = 0;
    let healthy = 0;
    let totalUnits = 0;
    for (const v of variants) {
      total += 1;
      totalUnits += v.stock;
      if (v.stock === 0) out += 1;
      else if (v.stock <= v.product.lowStockThreshold) low += 1;
      else healthy += 1;
    }
    return {
      total,
      out,
      low,
      healthy,
      totalUnits,
    };
  }),

  /** Recent stock movements (audit log). */
  movements: managerProcedure
    .input(
      z.object({
        variantId: z.string().cuid().optional(),
        productId: z.string().cuid().optional(),
        type: z
          .enum([
            "ALL",
            "SALE",
            "RESTOCK",
            "ADJUST",
            "REFUND",
          ])
          .default("ALL"),
        limit: z.number().int().min(1).max(100).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Parameters<typeof ctx.db.stockMovement.findMany>[0] extends infer T
        ? T extends { where?: infer W }
          ? W
          : never
        : never = {};
      if (input.variantId) where.variantId = input.variantId;
      if (input.productId) where.productId = input.productId;
      if (input.type !== "ALL") where.type = input.type;

      const rows = await ctx.db.stockMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          user: { select: { name: true, role: true } },
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, name: true, sku: true, stock: true } },
        },
      });
      return rows.map((m) => ({
        id: m.id,
        type: m.type,
        qty: m.qty,
        note: m.note,
        createdAt: m.createdAt,
        userName: m.user.name,
        userRole: m.user.role,
        product: m.product
          ? { id: m.product.id, name: m.product.name, sku: m.product.sku }
          : null,
        variant: m.variant
          ? { id: m.variant.id, name: m.variant.name, sku: m.variant.sku }
          : null,
      }));
    }),

  /**
   * Adjust a single variant's stock. Logs a StockMovement so the audit
   * trail is preserved. The transaction guarantees that the stock count
   * and the movement row are in lock-step.
   */
  adjust: managerProcedure
    .input(
      z.object({
        variantId: z.string().cuid(),
        qtyChange: z.number().int().refine((n) => n !== 0, "Quantity must be non-zero"),
        type: z.enum(["RESTOCK", "ADJUST"]),
        note: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const variant = await ctx.db.productVariant.findUnique({
        where: { id: input.variantId },
        select: { id: true, stock: true, name: true, sku: true, productId: true, product: { select: { trackStock: true, name: true } } },
      });
      if (!variant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Variant not found" });
      }
      if (!variant.product.trackStock) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${variant.product.name} has stock tracking disabled`,
        });
      }

      const newStock = variant.stock + input.qtyChange;
      if (newStock < 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reduce below zero (current stock: ${variant.stock})`,
        });
      }

      const result = await ctx.db.$transaction(async (tx) => {
        const updated = await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: newStock },
          select: { id: true, stock: true, name: true, sku: true, productId: true, product: { select: { lowStockThreshold: true, name: true } } },
        });
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            productId: variant.productId,
            type: input.type,
            qty: input.qtyChange,
            note: input.note?.trim() ?? null,
            userId: ctx.session.user.id,
          },
        });
        return updated;
      });

      return {
        variantId: result.id,
        newStock: result.stock,
        name: result.name,
        sku: result.sku,
        productName: result.product.name,
        productId: result.productId,
        threshold: result.product.lowStockThreshold,
      };
    }),
});
