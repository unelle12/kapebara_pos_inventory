import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  managerProcedure,
  publicProcedure,
} from "~/server/api/trpc";

/**
 * Stock status for a product (aggregated across its active variants).
 *  - OUT:        no stock at all (or all variants inactive)
 *  - LOW:        some variants at or below their product threshold
 *  - TRACK_OFF:  product has trackStock = false (skip stock checks)
 *  - OK:         everything healthy
 */
export type StockStatus = "OUT" | "LOW" | "TRACK_OFF" | "OK";

const listInput = z.object({
  search: z.string().trim().max(80).optional(),
  categoryId: z.string().cuid().optional(),
  stockStatus: z
    .enum(["ALL", "OK", "LOW", "OUT", "INACTIVE", "TRACK_OFF"])
    .default("ALL"),
  sortBy: z
    .enum(["name", "sku", "category", "stock", "margin", "updated"])
    .default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

export const productRouter = createTRPCRouter({
  /**
   * Public list of categories — used for the filter dropdown even on pages
   * a cashier might view (e.g. POS). No PII / cost data exposed.
   */
  categories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { sort: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        _count: { select: { products: true } },
      },
    });
  }),

  /**
   * Paginated, searchable, filterable product list. Manager+ only.
   *
   * Each row aggregates variant-level data so the UI doesn't need to walk
   * nested arrays. Stock status is computed server-side and returned as a
   * discrete enum for fast filtering & chip rendering.
   */
  list: managerProcedure.input(listInput).query(async ({ ctx, input }) => {
    const {
      search,
      categoryId,
      stockStatus,
      sortBy,
      sortDir,
      page,
      pageSize,
    } = input;

    // Build the WHERE clause based on filters.
    const where: Parameters<typeof ctx.db.product.findMany>[0] extends infer T
      ? T extends { where?: infer W }
        ? W
        : never
      : never = {
      active: stockStatus === "INACTIVE" ? false : true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // We need the full variant set to compute stock status, so we fetch
    // everything matching the (cheap) where-clause and then filter in memory.
    // At expected scale (hundreds of products) this is fine; once we cross
    // ~1k products we can move the stock filter to a denormalized column.
    const [allMatching, totalActive] = await Promise.all([
      ctx.db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          supplier: { select: { id: true, name: true } },
          variants: {
            where: { active: true },
            select: { id: true, stock: true, price: true, cost: true },
          },
        },
      }),
      ctx.db.product.count({ where: { active: true } }),
    ]);

    // Compute stock status per product.
    type Row = (typeof allMatching)[number] & {
      totalStock: number;
      minPrice: number;
      maxPrice: number;
      avgMargin: number;
      variantCount: number;
      stockStatus: StockStatus;
    };

    const rows: Row[] = allMatching.map((p) => {
      const variants = p.variants;
      const totalStock = variants.reduce((s, v) => s + v.stock, 0);
      const prices = variants.map((v) => Number(v.price));
      const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
      const maxPrice = prices.length ? Math.max(...prices) : Number(p.basePrice);

      // Average margin % across variants: (price - cost) / price
      const margins = variants
        .map((v) => {
          const price = Number(v.price);
          const cost = Number(v.cost);
          return price > 0 ? ((price - cost) / price) * 100 : 0;
        })
        .filter((m) => Number.isFinite(m));
      const avgMargin = margins.length
        ? margins.reduce((s, m) => s + m, 0) / margins.length
        : 0;

      let status: StockStatus;
      if (!p.trackStock) {
        status = "TRACK_OFF";
      } else if (variants.length === 0) {
        status = "OUT";
      } else if (variants.some((v) => v.stock <= 0)) {
        status = "OUT";
      } else if (variants.some((v) => v.stock <= p.lowStockThreshold)) {
        status = "LOW";
      } else {
        status = "OK";
      }

      return {
        ...p,
        totalStock,
        minPrice,
        maxPrice,
        avgMargin,
        variantCount: variants.length,
        stockStatus: status,
      };
    });

    // Stock-status filter (post-aggregation, since the comparison is on
    // computed `stockStatus`).
    const filtered =
      stockStatus === "ALL"
        ? rows
        : rows.filter((r) => r.stockStatus === stockStatus);

    // Sort.
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "sku":
          return a.sku.localeCompare(b.sku) * dir;
        case "category":
          return a.category.name.localeCompare(b.category.name) * dir;
        case "stock":
          return (a.totalStock - b.totalStock) * dir;
        case "margin":
          return (a.avgMargin - b.avgMargin) * dir;
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
        slug: r.slug,
        description: r.description,
        imageUrl: r.imageUrl,
        basePrice: Number(r.basePrice),
        lowStockThreshold: r.lowStockThreshold,
        trackStock: r.trackStock,
        active: r.active,
        updatedAt: r.updatedAt,
        category: r.category,
        supplier: r.supplier,
        totalStock: r.totalStock,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        avgMargin: Math.round(r.avgMargin * 10) / 10,
        variantCount: r.variantCount,
        stockStatus: r.stockStatus,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      totalActive,
    };
  }),

  /** Single product detail — for the view page / C2 edit form. */
  byId: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
          supplier: { select: { id: true, name: true } },
          variants: {
            orderBy: { sort: "asc" },
          },
        },
      });
      if (!product) return null;

      const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
      const prices = product.variants.map((v) => Number(v.price));
      const minPrice = prices.length ? Math.min(...prices) : Number(product.basePrice);
      const maxPrice = prices.length ? Math.max(...prices) : Number(product.basePrice);
      const totalUnitsSold = await ctx.db.saleItem.aggregate({
        where: { productId: product.id },
        _sum: { qty: true },
      });

      return {
        ...product,
        basePrice: Number(product.basePrice),
        cost: Number(product.cost),
        variants: product.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          cost: Number(v.cost),
        })),
        totalStock,
        minPrice,
        maxPrice,
        unitsSold: totalUnitsSold._sum.qty ?? 0,
      };
    }),

  /* ------------------------------------------------------------------
   * Mutations
   * ------------------------------------------------------------------ */

  /** Suppliers list for the product form's supplier dropdown. Manager+. */
  suppliers: managerProcedure.query(async ({ ctx }) => {
    return ctx.db.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, contact: true },
    });
  }),

  /**
   * Create a new product with at least one variant. SKU + variant SKU are
   * auto-suffixed with a numeric tag if they collide with an existing row
   * (rare, since SKU is the unique key — but happens during duplicate
   * imports). Slug is derived from the product name.
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(120),
        sku: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[A-Z0-9-]+$/i, "Letters, numbers and dashes only")
          .transform((s) => s.toUpperCase()),
        description: z.string().trim().max(2000).optional(),
        imageUrl: z.string().url().or(z.literal("")).optional(),
        basePrice: z.number().nonnegative().max(999999.99),
        cost: z.number().nonnegative().max(999999.99),
        categoryId: z.string().cuid(),
        supplierId: z.string().cuid().optional(),
        trackStock: z.boolean().default(true),
        lowStockThreshold: z.number().int().nonnegative().max(9999).default(5),
        active: z.boolean().default(true),
        variants: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(80),
              sku: z
                .string()
                .trim()
                .min(2)
                .max(40)
                .regex(/^[A-Z0-9-]+$/i)
                .transform((s) => s.toUpperCase()),
              price: z.number().nonnegative().max(999999.99),
              cost: z.number().nonnegative().max(999999.99),
              stock: z.number().int().nonnegative().max(99999).default(0),
              attributes: z.record(z.string(), z.string()).default({}),
              sort: z.number().int().nonnegative().default(0),
              active: z.boolean().default(true),
            }),
          )
          .min(1, "At least one variant is required")
          .max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name);
      const sku = await ensureUniqueSku(ctx.db, input.sku);
      const variantSkus = await Promise.all(
        input.variants.map((v) => ensureUniqueSku(ctx.db, v.sku)),
      );

      const product = await ctx.db.product.create({
        data: {
          name: input.name,
          sku,
          slug: await ensureUniqueSlug(ctx.db, slug),
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          basePrice: input.basePrice,
          cost: input.cost,
          categoryId: input.categoryId,
          supplierId: input.supplierId ?? null,
          trackStock: input.trackStock,
          lowStockThreshold: input.lowStockThreshold,
          active: input.active,
          variants: {
            create: input.variants.map((v, i) => ({
              name: v.name,
              sku: variantSkus[i]!,
              price: v.price,
              cost: v.cost,
              stock: v.stock,
              attributes: v.attributes,
              sort: v.sort,
              active: v.active,
            })),
          },
        },
        select: { id: true, slug: true, sku: true },
      });

      return product;
    }),

  /**
   * Update a product and its variants. Variants not in the incoming list
   * are soft-archived (active=false) to preserve sales history. Variants
   * with an id are updated; variants without an id are created.
   */
  update: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().trim().min(2).max(120),
        sku: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[A-Z0-9-]+$/i)
          .transform((s) => s.toUpperCase()),
        description: z.string().trim().max(2000).optional(),
        imageUrl: z.string().url().or(z.literal("")).optional(),
        basePrice: z.number().nonnegative().max(999999.99),
        cost: z.number().nonnegative().max(999999.99),
        categoryId: z.string().cuid(),
        supplierId: z.string().cuid().optional(),
        trackStock: z.boolean(),
        lowStockThreshold: z.number().int().nonnegative().max(9999),
        active: z.boolean(),
        variants: z
          .array(
            z.object({
              id: z.string().cuid().optional(),
              name: z.string().trim().min(1).max(80),
              sku: z
                .string()
                .trim()
                .min(2)
                .max(40)
                .regex(/^[A-Z0-9-]+$/i)
                .transform((s) => s.toUpperCase()),
              price: z.number().nonnegative().max(999999.99),
              cost: z.number().nonnegative().max(999999.99),
              stock: z.number().int().nonnegative().max(99999),
              attributes: z.record(z.string(), z.string()).default({}),
              sort: z.number().int().nonnegative().default(0),
              active: z.boolean(),
            }),
          )
          .min(1)
          .max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: { variants: { select: { id: true } } },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const newSlug = slugify(input.name);
      const skuChanged = existing.sku !== input.sku;
      const slugChanged = existing.slug !== newSlug;
      const finalSku = skuChanged
        ? await ensureUniqueSku(ctx.db, input.sku, input.id)
        : existing.sku;
      const finalSlug = slugChanged
        ? await ensureUniqueSlug(ctx.db, newSlug, input.id)
        : existing.slug;

      // Sync variants: update by id, create the rest, archive missing.
      const incomingIds = new Set(
        input.variants.map((v) => v.id).filter((x): x is string => Boolean(x)),
      );
      const toArchive = existing.variants
        .map((v) => v.id)
        .filter((id) => !incomingIds.has(id));

      const product = await ctx.db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: input.id },
          data: {
            name: input.name,
            sku: finalSku,
            slug: finalSlug,
            description: input.description ?? null,
            imageUrl: input.imageUrl ?? null,
            basePrice: input.basePrice,
            cost: input.cost,
            categoryId: input.categoryId,
            supplierId: input.supplierId ?? null,
            trackStock: input.trackStock,
            lowStockThreshold: input.lowStockThreshold,
            active: input.active,
          },
        });

        // Archive missing variants
        if (toArchive.length) {
          await tx.productVariant.updateMany({
            where: { id: { in: toArchive } },
            data: { active: false },
          });
        }

        // Upsert incoming variants
        for (const v of input.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                price: v.price,
                cost: v.cost,
                stock: v.stock,
                attributes: v.attributes,
                sort: v.sort,
                active: v.active,
              },
            });
          } else {
            // Make sure the new variant SKU doesn't collide with anything
            const sku = await ensureUniqueSku(tx, v.sku, v.id);
            await tx.productVariant.create({
              data: {
                productId: input.id,
                name: v.name,
                sku,
                price: v.price,
                cost: v.cost,
                stock: v.stock,
                attributes: v.attributes,
                sort: v.sort,
                active: v.active,
              },
            });
          }
        }

        return tx.product.findUniqueOrThrow({
          where: { id: input.id },
          select: { id: true, slug: true, sku: true },
        });
      });

      return product;
    }),

  /** Soft-archive / unarchive a product. */
  toggleActive: managerProcedure
    .input(z.object({ id: z.string().cuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: { active: input.active },
        select: { id: true, active: true },
      });
    }),
});

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * If `desired` collides with an existing SKU/slug, append `-2`, `-3`, etc.
 * `excludeId` is the id of the row being updated (so its own value doesn't
 * count as a collision).
 */
async function ensureUniqueSku(
  db: {
    product: { findFirst: (a: { where: Record<string, unknown> }) => Promise<{ sku: string } | null> };
    productVariant: { findFirst: (a: { where: Record<string, unknown> }) => Promise<{ sku: string } | null> };
  },
  desired: string,
  excludeId?: string,
): Promise<string> {
  // Try both tables — SKUs are globally unique across the two
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? desired : `${desired}-${i + 1}`;
    const productCollision = await db.product.findFirst({
      where: { sku: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    const variantCollision = await db.productVariant.findFirst({
      where: { sku: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!productCollision && !variantCollision) return candidate;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not generate a unique SKU after 100 attempts",
  });
}

async function ensureUniqueSlug(
  db: {
    product: { findFirst: (a: { where: Record<string, unknown> }) => Promise<{ slug: string } | null> };
  },
  desired: string,
  excludeId?: string,
): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? desired : `${desired}-${i + 1}`;
    const collision = await db.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!collision) return candidate;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not generate a unique slug after 100 attempts",
  });
}
