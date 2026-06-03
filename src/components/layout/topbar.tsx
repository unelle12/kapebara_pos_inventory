"use client";

import * as React from "react";
import { Menu, Search } from "lucide-react";
import { useSession } from "next-auth/react";

import { NotificationsBell } from "~/components/layout/notifications-bell";
import { UserMenu } from "~/components/layout/user-menu";
import { CommandPalette } from "~/components/layout/command-palette";
import { Badge } from "~/components/ui/badge";

export function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center rounded-xl text-fg-muted hover:bg-cream-100 hover:text-fg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Search trigger (opens command palette) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            );
          }}
          className="group flex h-10 w-40 items-center gap-2 rounded-xl border border-border bg-cream-50/60 px-3 text-left text-sm text-fg-subtle transition-colors hover:border-border-strong hover:bg-cream-50 sm:w-72"
        >
          <Search className="size-4" />
          <span className="truncate">Search…</span>
          <kbd className="ml-auto hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {role && (
            <Badge variant="espresso" size="sm" className="hidden md:inline-flex">
              {role.toLowerCase()}
            </Badge>
          )}
          <NotificationsBell />
          <UserMenu />
        </div>
      </div>
      {role && <CommandPalette role={role} />}
    </header>
  );
}
