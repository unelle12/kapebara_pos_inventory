"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { UserForm } from "~/components/user/user-form";
import { api } from "~/trpc/react";
import type { UserRole as UserRoleT } from "../../../../../../generated/prisma";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRoleT;
  active: boolean;
}

export default function EditUserForm({ user }: { user: UserData }) {
  const router = useRouter();
  const update = api.user.update.useMutation({
    onSuccess: (u) => router.push(`/users/${u.id}`),
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase E2 · Users &amp; roles
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Edit {user.name}
          </h1>
          <p className="mt-1 text-fg-muted">
            Update name, role, and active status. Use{" "}
            <Link
              href={`/users/${user.id}`}
              className="font-medium text-caramel-700 underline-offset-2 hover:underline"
            >
              the profile page
            </Link>{" "}
            to reset the password.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/users">
            <Button variant="outline" size="md">
              <ArrowLeft className="size-4" />
              All users
            </Button>
          </Link>
          <Link href={`/users/${user.id}`}>
            <Button variant="outline" size="md">
              View profile
            </Button>
          </Link>
        </div>
      </section>

      <UserForm
        mode="edit"
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          password: "",
        }}
        onSubmit={async (data) => {
          await update.mutateAsync({
            id: user.id,
            name: data.name,
            role: data.role,
            active: data.active,
          });
        }}
      />
    </div>
  );
}
