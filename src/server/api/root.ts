import { authRouter } from "~/server/api/routers/auth";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { posRouter } from "~/server/api/routers/pos";
import { productRouter } from "~/server/api/routers/product";
import { reportRouter } from "~/server/api/routers/report";
import { saleRouter } from "~/server/api/routers/sale";
import { stockRouter } from "~/server/api/routers/stock";
import { systemRouter } from "~/server/api/routers/system";
import { supplierRouter } from "~/server/api/routers/supplier";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  product: productRouter,
  stock: stockRouter,
  supplier: supplierRouter,
  user: userRouter,
  pos: posRouter,
  sale: saleRouter,
  report: reportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
