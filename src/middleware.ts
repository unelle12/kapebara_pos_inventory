// Edge-runtime middleware: just the authorized() callback, no DB / bcrypt.
import NextAuth from "next-auth";

import { authConfig } from "~/server/auth/config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all paths except static assets and API routes (auth + trpc handle their own).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)",
  ],
};
