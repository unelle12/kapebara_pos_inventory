"use client";

import * as React from "react";

import { type NavSection } from "~/lib/nav";
import { Sidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";
import { MobileNav } from "~/components/layout/mobile-nav";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

export function AppShell({
  sections,
  children,
}: {
  sections: NavSection[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Hydrate collapsed state from localStorage
  React.useEffect(() => {
    const stored = window.localStorage.getItem("kapabara:sidebar");
    if (stored === "collapsed") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem("kapabara:sidebar", next ? "collapsed" : "open");
      return next;
    });
  }

  // Low-stock count → badge for the "Stock" nav item
  const { data: lowStockCount = 0 } = api.dashboard.lowStockCount.useQuery(
    undefined,
    { refetchInterval: 60_000 },
  );
  const badges = { lowStock: lowStockCount };

  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar
        sections={sections}
        collapsed={collapsed}
        onToggle={toggle}
        badges={badges}
      />
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sections={sections}
        badges={badges}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main
          className={cn(
            "flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8",
          )}
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
