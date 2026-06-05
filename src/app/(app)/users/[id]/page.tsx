import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, KeyRound, Mail, Users } from "lucide-react";
import Link from "next/link";

import { requireRole } from "~/lib/auth-helpers";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import { RoleBadge, initialsFor } from "~/components/user/role-badge";
import { UserRole } from "../../../../../generated/prisma";
import { formatDate } from "~/lib/utils";

export const metadata = {
  title: "User · Kapabara",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("OWNER");
  const { id } = await params;
  if (!/^c[a-z0-9]{20,}$/i.test(id)) notFound();

  let user;
  try {
    user = await api.user.byId({ id });
  } catch {
    notFound();
  }
  if (!user) notFound();

  const isSelf = user.id === session.user.id;
  const lastSignIn = formatDate(user.updatedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={
                user.role === UserRole.OWNER
                  ? "flex size-20 shrink-0 items-center justify-center rounded-2xl bg-espresso-100 font-display text-2xl text-espresso-800"
                  : user.role === UserRole.MANAGER
                    ? "flex size-20 shrink-0 items-center justify-center rounded-2xl bg-caramel-100 font-display text-2xl text-caramel-800"
                    : "flex size-20 shrink-0 items-center justify-center rounded-2xl bg-sage-100 font-display text-2xl text-sage-700"
              }
            >
              {initialsFor(user.name, user.email)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl text-espresso-900 sm:text-4xl">
                  {user.name}
                </h1>
                {!user.active && <Badge variant="neutral">Inactive</Badge>}
                {isSelf && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    you
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                <Mail className="size-3.5" />
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <Badge variant={user.active ? "sage" : "neutral"} size="sm">
                  {user.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/users">
              <Button variant="outline" size="md">
                <ArrowLeft className="size-4" />
                All users
              </Button>
            </Link>
            <Link href={`/users/${user.id}/edit`}>
              <Button variant="primary" size="md">
                <Edit3 className="size-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales recorded" value={user.saleCount.toString()} icon={Users} />
        <Stat
          label="Refunds processed"
          value={user.refundCount.toString()}
          icon={KeyRound}
        />
        <Stat
          label="Stock movements"
          value={user.movementCount.toString()}
          icon={Users}
        />
        <Stat label="Last updated" value={lastSignIn} icon={Users} />
      </section>

      {/* Member-since */}
      <section className="card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
          Member since
        </p>
        <p className="mt-1 font-display text-2xl text-espresso-900">
          {formatDate(user.createdAt)}
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Account created on this date. The user has been on the team for{" "}
          <strong className="text-fg">
            {Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(user.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )}{" "}
            days
          </strong>
          .
        </p>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-fg-subtle" />}
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <p className="mt-2 font-display text-2xl tabular-nums text-espresso-900">
        {value}
      </p>
    </div>
  );
}
