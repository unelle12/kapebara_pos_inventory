"use client";

import Link from "next/link";
import { User } from "lucide-react";

import { cn } from "~/lib/utils";

interface Account {
  id: string;
  name: string;
  email: string;
}

interface AccountCardProps {
  account: Account;
  role: "OWNER" | "MANAGER" | "CASHIER";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AccountCard({ account, role }: AccountCardProps) {
  const initials = getInitials(account.name);

  return (
    <Link
      href={`/login/${role.toLowerCase()}/${account.id}`}
      className={cn(
        "group relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all",
        "bg-surface border-border hover:border-caramel-300 hover:bg-cream-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-200"
      )}
    >
      <div
        className="mb-4 flex size-16 items-center justify-center rounded-xl bg-caramel-100 text-caramel-700 transition-colors group-hover:bg-caramel-200"
      >
        <span className="text-xl font-medium">{initials}</span>
      </div>
      <h3 className="font-medium text-espresso-900 text-center w-full truncate">{account.name}</h3>
      <p className="mt-1 text-sm text-fg-muted text-center truncate">{account.email}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-caramel-50 px-2.5 py-1 text-[11px] font-medium text-caramel-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <User className="size-3" />
        Select
      </span>
    </Link>
  );
}