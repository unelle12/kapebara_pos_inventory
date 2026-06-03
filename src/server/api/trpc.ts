/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { hasRole, type Role } from "~/lib/permissions";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();
  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
 * 3. ROUTER & PROCEDURE
 */

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  const end = Date.now();
  if (t._config.isDev) {
    console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
  }
  return result;
});

/** Anyone — signed in or not. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Must be signed in. */
const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceUser);

/** Requires role ≥ MANAGER (managers + owners). */
const enforceRole = (required: Role) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!hasRole(ctx.session.user.role, required)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires ${required} or higher`,
      });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  });

export const managerProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceRole("MANAGER"));

export const ownerProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceRole("OWNER"));
