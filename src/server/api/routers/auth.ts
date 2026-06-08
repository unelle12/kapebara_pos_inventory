import { z } from "zod";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  getAccountsByRole: publicProcedure
    .input(z.object({ role: z.enum(["OWNER", "MANAGER", "CASHIER"]) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        where: { role: input.role, active: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    }),

  registerUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["MANAGER", "CASHIER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      const passwordHash = await hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          active: true,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }),
});