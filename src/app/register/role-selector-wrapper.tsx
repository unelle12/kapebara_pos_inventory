"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { RoleSelector } from "~/components/auth/role-selector";

export function RegisterRoleSelectorWrapper() {
  return (
    <Suspense
      fallback={
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      }
    >
      <RoleSelector mode="register" />
    </Suspense>
  );
}