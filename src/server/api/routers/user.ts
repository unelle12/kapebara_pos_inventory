import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";

import { UserRole } from "../../../../generated/prisma";
import { createTRPCRouter, ownerProcedure } from "~/server/api/trpc";

/* ------------------------------------------------------------------
   User Router
   ------------------------------------------------------------------
   Owner-only CRUD for managing staff. All procedures reject anyone
   below OWNER (manager/cashier cannot manage users). Last-OWNER
   protection: an owner cannot demote or deactivate themselves.
   ------------------------------------------------------------------ */

const roleEnum = z.enum(["CASHIER", "MANAGER", "OWNER"]);

export const userRouter = createTRPCRouter({
  /**
   * Paginated, searchable list of users. Owner only.
   */
  list: ownerProcedure
    .input(
      z.object({
        search: z.string().trim().max(80).optional(),
        role: roleEnum.optional(),
        active: z.boolean().optional(),
        sortBy: z.enum(["name", "email", "role", "createdAt"]).default("name"),
        sortDir: z.enum(["asc", "desc"]).default("asc"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, role, active, sortBy, sortDir, page, pageSize } = input;

      const where: {
        OR?: Array<Record<string, unknown>>;
        role?: typeof role;
        active?: boolean;
      } = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }
      if (role) where.role = role;
      if (active !== undefined) where.active = active;

      const [rows, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                sales: true,
                stockMovements: true,
                refunds: true,
              },
            },
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        items: rows.map(({ _count, ...r }) => ({
          ...r,
          saleCount: _count.sales,
          movementCount: _count.stockMovements,
          refundCount: _count.refunds,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  /**
   * Get a single user by ID with full activity counts. Owner only.
   */
  byId: ownerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              sales: true,
              stockMovements: true,
              refunds: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return {
        ...user,
        saleCount: user._count.sales,
        movementCount: user._count.stockMovements,
        refundCount: user._count.refunds,
      };
    }),

  /**
   * Lightweight stats for the dashboard tiles. Owner only.
   */
  stats: ownerProcedure.query(async ({ ctx }) => {
    const [total, owners, managers, cashiers, active, inactive] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.user.count({ where: { role: UserRole.OWNER } }),
        ctx.db.user.count({ where: { role: UserRole.MANAGER } }),
        ctx.db.user.count({ where: { role: UserRole.CASHIER } }),
        ctx.db.user.count({ where: { active: true } }),
        ctx.db.user.count({ where: { active: false } }),
      ]);
    return { total, owners, managers, cashiers, active, inactive };
  }),

  /**
   * Create a new user. Owner only.
   */
  create: ownerProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().toLowerCase().email().max(100),
        password: z.string().min(8, "Password must be at least 8 characters").max(72),
        role: roleEnum.default(UserRole.CASHIER),
        active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A user with email "${input.email}" already exists`,
        });
      }

      const passwordHash = await hash(input.password, 10);
      const { password: _ignored, ...data } = input;
      void _ignored;

      const user = await ctx.db.user.create({
        data: { ...data, passwordHash },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    }),

  /**
   * Update a user (name, role, active). Owner only.
   * Self-demotion / self-deactivation is blocked to prevent locking out the system.
   */
  update: ownerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().trim().min(1).max(100).optional(),
        role: roleEnum.optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;

      if (id === ctx.session.user.id) {
        if (patch.role && patch.role !== UserRole.OWNER) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot demote yourself",
          });
        }
        if (patch.active === false) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot deactivate your own account",
          });
        }
      }

      if (patch.role && patch.role !== UserRole.OWNER) {
        const otherOwners = await ctx.db.user.count({
          where: { role: UserRole.OWNER, active: true, NOT: { id } },
        });
        if (otherOwners === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot demote the last active owner. Promote another user to OWNER first.",
          });
        }
      }

      if (patch.active === false) {
        const otherOwners = await ctx.db.user.count({
          where: { role: UserRole.OWNER, active: true, NOT: { id } },
        });
        if (otherOwners === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot deactivate the last active owner. Promote another user to OWNER first.",
          });
        }
      }

      try {
        const user = await ctx.db.user.update({
          where: { id },
          data: patch,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return user;
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
    }),

  /**
   * Toggle active flag. Owner only. Self-deactivation is blocked.
   */
  toggleActive: ownerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot deactivate your own account",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { active: true, role: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (target.active && target.role === UserRole.OWNER) {
        const otherOwners = await ctx.db.user.count({
          where: { role: UserRole.OWNER, active: true, NOT: { id: input.id } },
        });
        if (otherOwners === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot deactivate the last active owner. Promote another user to OWNER first.",
          });
        }
      }

      return await ctx.db.user.update({
        where: { id: input.id },
        data: { active: !target.active },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  /**
   * Reset a user's password. Owner only. Can target any user (including self).
   */
  resetPassword: ownerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(72),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { id: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const passwordHash = await hash(input.newPassword, 10);
      await ctx.db.user.update({
        where: { id: input.id },
        data: { passwordHash },
      });
      return { ok: true as const };
    }),
});
