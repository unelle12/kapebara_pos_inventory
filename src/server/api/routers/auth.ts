import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { signIn, signOut } from "~/server/auth";

export const authRouter = createTRPCRouter({
  /** Current session (null if not signed in). */
  me: publicProcedure.query(({ ctx }) => ctx.session?.user ?? null),

  /** Sign in via the credentials provider. Throws on invalid creds. */
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await signIn("credentials", {
          email: input.email,
          password: input.password,
          redirect: false,
        });
        return { ok: true as const };
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
    }),

  signOut: protectedProcedure.mutation(async () => {
    await signOut({ redirect: false });
    return { ok: true as const };
  }),
});
