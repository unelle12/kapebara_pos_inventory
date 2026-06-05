import { requireRole } from "~/lib/auth-helpers";
import { api } from "~/trpc/server";
import { UsersTable } from "~/components/user/users-table";
import { UsersToolbar } from "~/components/user/users-toolbar";

export const metadata = {
  title: "Users · Kapabara",
};

export default async function UsersPage() {
  const session = await requireRole("OWNER");
  const data = await api.user.list({ page: 1, pageSize: 20 });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase E2 · Users &amp; roles
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-espresso-900 sm:text-4xl">
            Team
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Add staff, change roles, and reset passwords. Only owners can manage
            users.
          </p>
        </div>
      </section>

      <UsersToolbar total={data.total} />
      <UsersTable initialData={data} currentUserId={session.user.id} />
    </div>
  );
}
