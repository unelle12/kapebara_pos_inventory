import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/* ------------------------------------------------------------------
 * POS Router
 *
 * Cashier-accessible queries for the point-of-sale terminal. Returns
 * product + variant data WITHOUT cost/margin/supplier info so cashiers
 * can't see wholesale pricing. Sale mutations live in the `saleRouter`
 * (created in D2).
 * ------------------------------------------------------------------ */

const POS_PAGE_SIZE_DEFAULT = 60;
const POS_PAGE_SIZE_MAX = 200;

const posListInput = z.object({
  search: z.string().trim().max(80).optional(),
  categoryId: z.string().cuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(POS_PAGE_SIZE_MAX).default(POS_PAGE_SIZE_DEFAULT),
});

export const posRouter = createTRPCRouter({
  /**
   * Paginated, searchable product list for the POS terminal.
   * Returns only sale-relevant fields (no cost, no supplier).
   */
  list: protectedProcedure.input(posListInput).query(async ({ ctx, input }) => {
    const { search, categoryId, page, pageSize } = input;

    const where: Record<string, unknown> = { active: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [rows, total] = await Promise.all([
      ctx.db.product.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          sku: true,
          imageUrl: true,
          trackStock: true,
          basePrice: true,
          category: { select: { id: true, name: true, color: true } },
          variants: {
            where: { active: true },
            orderBy: { sort: "asc" },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              stock: true,
              attributes: true,
              sort: true,
            },
          },
        },
      }),
      ctx.db.product.count({ where: { active: true } }),
    ]);

    return {
      items: rows.map((p) => {
        const variants = p.variants;
        const totalStock = variants.reduce((s, v) => s + v.stock, 0);
        const prices = variants.map((v) => Number(v.price));
        const minPrice = prices.length
          ? Math.min(...prices)
          : Number(p.basePrice);
        const maxPrice = prices.length
          ? Math.max(...prices)
          : Number(p.basePrice);

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          imageUrl: p.imageUrl,
          trackStock: p.trackStock,
          category: p.category,
          totalStock,
          minPrice,
          maxPrice,
          variantCount: variants.length,
          variants: variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: Number(v.price),
            stock: v.stock,
            attributes: v.attributes as Record<string, string>,
          })),
        };
      }),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }),

  /**
   * Quick lookup by variant SKU — used by the barcode scanner.
   * Returns at most one variant + its parent product, sufficient to add
   * to cart in a single call.
   */
  findByVariantSku: protectedProcedure
    .input(z.object({ sku: z.string().trim().min(1).max(40) }))
    .query(async ({ ctx, input }) => {
      const variant = await ctx.db.productVariant.findFirst({
        where: {
          sku: { equals: input.sku, mode: "insensitive" },
          active: true,
          product: { active: true },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          attributes: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              trackStock: true,
              category: { select: { id: true, name: true, color: true } },
            },
          },
        },
      });
      if (!variant) return null;
      return {
        variantId: variant.id,
        variantName: variant.name,
        variantSku: variant.sku,
        price: Number(variant.price),
        stock: variant.stock,
        attributes: variant.attributes as Record<string, string>,
        product: variant.product,
      };
    }),
});
