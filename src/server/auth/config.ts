import { compare } from "bcryptjs";
import { z } from "zod";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "~/server/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Edge-safe portion of the Auth.js config. We keep this small so the
 * middleware can use it without pulling Node-only modules like bcrypt.
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
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.active) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
