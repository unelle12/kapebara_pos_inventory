import { type NextAuthConfig } from "next-auth";

/**
 * Edge-safe portion of the Auth.js config. This module MUST NOT import
 * `~/server/db`, `bcryptjs`, or any Node-only module, because Next.js
 * middleware runs in the Edge Runtime where the Prisma WASM engine
 * cannot use Node APIs like `setImmediate`.
 *
 * The `Credentials` provider (which needs `db` and `bcrypt`) is added
 * in `~/server/auth/index.ts`, which extends this config for the Node
 * runtime (route handlers, server components, server actions).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8h shift
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as typeof session.user.role) ?? session.user.role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const path = request.nextUrl.pathname;
      const isOnApp =
        path.startsWith("/dashboard") ||
        path.startsWith("/pos") ||
        path.startsWith("/products") ||
        path.startsWith("/suppliers") ||
        path.startsWith("/restock") ||
        path.startsWith("/sales") ||
        path.startsWith("/reports") ||
        path.startsWith("/users") ||
        path.startsWith("/settings");
      const isOnLogin = path === "/login";
      if (isOnApp && !isLoggedIn) return false; // → /login
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
