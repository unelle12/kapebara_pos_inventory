"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { iconFor, type NavItem, type NavSection } from "~/lib/nav";
import { Logo } from "~/components/brand/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export function Sidebar({
  sections,
  collapsed,
  onToggle,
  badges,
}: {
  sections: NavSection[];
  collapsed: boolean;
  onToggle: () => void;
  badges: Record<string, number>;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {collapsed ? (
            <div className="flex size-10 items-center justify-center">
              <Logo size="sm" showText={false} />
            </div>
          ) : (
            <Logo size="sm" />
          )}
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-cream-100 hover:text-fg",
              collapsed && "hidden",
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      collapsed={collapsed}
                      badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Toggle (when collapsed) */}
        {collapsed && (
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={onToggle}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-fg-muted hover:bg-cream-100 hover:text-fg"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

function NavLink({
  item,
  collapsed,
  badge,
}: {
  item: NavItem;
  collapsed: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/")) ||
    (item.href === "/dashboard" && pathname === "/dashboard");
  const Icon = iconFor(item.icon);

  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-caramel-100 text-caramel-800"
          : "text-fg-muted hover:bg-cream-100 hover:text-fg",
        collapsed && "justify-center",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-caramel-700" : "text-fg-subtle group-hover:text-fg",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-caramel-700 text-cream-50" : "bg-clay-500 text-white",
          )}
        >
          {badge}
        </span>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute right-1.5 top-1.5 inline-flex size-2 rounded-full bg-clay-500 ring-2 ring-surface" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}
