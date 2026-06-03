import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

/**
 * System / health-check router. Returns a timestamp; useful for smoke-testing
 * the tRPC pipeline until real routers are added in upcoming tasks.
 */
export const systemRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true as const,
    now: new Date().toISOString(),
  })),
});
