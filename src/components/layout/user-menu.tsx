"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, User as UserIcon, ChevronDown, Settings, CreditCard } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, initials } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ROLE_LABELS } from "~/lib/permissions";

export function UserMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const role = session?.user?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2.5 rounded-xl border border-border bg-surface px-1.5 py-1.5 pr-3 text-sm transition-all hover:border-border-strong hover:shadow-sm"
        >
          <Avatar>
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none text-fg">{name}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-subtle">
              {role ? ROLE_LABELS[role] : "—"}
            </p>
          </div>
          <ChevronDown className="size-3.5 text-fg-subtle transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <DropdownMenuLabel className="!py-3">
          <p className="text-sm font-medium text-fg">{name}</p>
          <p className="mt-0.5 text-xs font-normal text-fg-muted">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <UserIcon className="size-4" />
            My dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <CreditCard className="size-4" />
          Switch register
        </DropdownMenuItem>
        {role === "OWNER" && (
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void signOut({ redirect: false }).then(() => {
              window.location.href = "/login";
            });
          }}
          className="text-red-700 focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
