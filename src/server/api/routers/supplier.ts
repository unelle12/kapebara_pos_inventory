import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, managerProcedure } from "~/server/api/trpc";

/* ------------------------------------------------------------------
   Supplier Router
   ------------------------------------------------------------------ */

export const supplierRouter = createTRPCRouter({
  /**
   * Paginated, searchable list of suppliers. Manager+ only.
   */
  list: managerProcedure
    .input(
      z.object({
        search: z.string().trim().max(80).optional(),
        active: z.boolean().optional(),
        sortBy: z.enum(["name", "contact", "createdAt"]).default("name"),
        sortDir: z.enum(["asc", "desc"]).default("asc"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, active, sortBy, sortDir, page, pageSize } = input;

      const where: Parameters<typeof ctx.db.supplier.findMany>[0] extends infer T
        ? T extends { where?: infer W }
          ? W
          : never
        : never = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { contact: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ];
      }

      if (active !== undefined) {
        where.active = active;
      }

      const [rows, total] = await Promise.all([
        ctx.db.supplier.findMany({
          where,
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
            phone: true,
            address: true,
            notes: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { products: true },
            },
          },
        }),
        ctx.db.supplier.count({ where }),
      ]);

      return {
        items: rows.map(({ _count, ...r }) => ({
          ...r,
          productCount: _count.products,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  /**
   * Get a single supplier by ID. Manager+ only.
   */
  byId: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const supplier = await ctx.db.supplier.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          contact: true,
          email: true,
          phone: true,
          address: true,
          notes: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              basePrice: true,
              active: true,
              category: {
                select: { id: true, name: true, color: true },
              },
              variants: {
                select: { id: true, name: true, sku: true, stock: true },
                where: { active: true },
              },
            },
          },
        },
      });

      if (!supplier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }

      return supplier;
    }),

  /**
   * Create a new supplier. Manager+ only.
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        contact: z.string().max(100).optional(),
        email: z.string().email().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().max(200).optional(),
        notes: z.string().max(500).optional(),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if supplier with same name already exists
      const existing = await ctx.db.supplier.findFirst({
        where: { name: input.name },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Supplier with name "${input.name}" already exists`,
        });
      }

      return await ctx.db.supplier.create({ data: input });
    }),

  /**
   * Update a supplier. Manager+ only.
   */
  update: managerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(100).optional(),
        contact: z.string().max(100).optional(),
        email: z.string().email().max(100).optional(),
        phone: z.string().max(20).optional(),
        address: z.string().max(200).optional(),
        notes: z.string().max(500).optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if another supplier with the same name exists
      if (data.name) {
        const existing = await ctx.db.supplier.findFirst({
          where: { name: data.name, NOT: { id } },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Supplier with name "${data.name}" already exists`,
          });
        }
      }

      const supplier = await ctx.db.supplier.update({
        where: { id },
        data,
      });

      if (!supplier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }

      return supplier;
    }),

  /**
   * Toggle supplier active status. Manager+ only.
   */
  toggleActive: managerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const supplier = await ctx.db.supplier.findUnique({
        where: { id: input.id },
      });

      if (!supplier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }

      return await ctx.db.supplier.update({
        where: { id: input.id },
        data: { active: !supplier.active },
      });
    }),

  /**
   * Get all active suppliers for dropdowns/references. Public procedure.
   */
  active: managerProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.supplier.findMany({
        where: { active: true },
        select: { id: true, name: true, contact: true, email: true },
        orderBy: { name: "asc" },
      });
    }),
});