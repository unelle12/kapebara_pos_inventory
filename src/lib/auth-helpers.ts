import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { hasRole, type Role } from "~/lib/permissions";

/** Throw redirect to /login if not signed in; otherwise return the session. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Throw 403-style redirect if role is below required. */
export async function requireRole(required: Role) {
  const session = await requireUser();
  if (!hasRole(session.user.role, required)) {
    redirect("/dashboard?error=forbidden");
  }
  return session;
}
