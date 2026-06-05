"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { UserForm } from "~/components/user/user-form";
import { api } from "~/trpc/react";

export default function NewUserForm() {
  const router = useRouter();
  const create = api.user.create.useMutation({
    onSuccess: (u) => {
      router.push(`/users/${u.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase E2 · Users &amp; roles
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Add a team member
          </h1>
          <p className="mt-1 text-fg-muted">
            Create a new login. They can sign in with the email and password you
            set.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/users">
            <Button variant="outline" size="md">
              <ArrowLeft className="size-4" />
              Back to list
            </Button>
          </Link>
        </div>
      </section>

      <UserForm
        mode="create"
        onSubmit={async (data) => {
          if (data.password === undefined) {
            throw new Error("Password is required for new users");
          }
          await create.mutateAsync({
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            active: data.active,
          });
        }}
      />
    </div>
  );
}
