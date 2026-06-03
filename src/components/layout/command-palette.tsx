"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { iconFor, QUICK_ACTIONS, type IconName } from "~/lib/nav";
import { hasRole, type Role } from "~/lib/permissions";
import { cn } from "~/lib/utils";

const PAGES: { label: string; href: string; icon: IconName; minRole: Role }[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", minRole: "CASHIER" },
  { label: "POS", href: "/pos", icon: "ShoppingCart", minRole: "CASHIER" },
  { label: "Products", href: "/products", icon: "Package", minRole: "MANAGER" },
  { label: "Stock", href: "/stock", icon: "Boxes", minRole: "MANAGER" },
  { label: "Sales", href: "/sales", icon: "History", minRole: "CASHIER" },
  { label: "Reports", href: "/reports", icon: "BarChart3", minRole: "MANAGER" },
  { label: "Suppliers", href: "/suppliers", icon: "Truck", minRole: "MANAGER" },
  { label: "Users", href: "/users", icon: "Users", minRole: "OWNER" },
  { label: "Settings", href: "/settings", icon: "Settings", minRole: "OWNER" },
];

export function CommandPalette({ role }: { role: Role }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function run(href: string) {
    setOpen(false);
    router.push(href);
  }

  const actions = QUICK_ACTIONS.filter((a) => hasRole(role, a.minRole));
  const pages = PAGES.filter((p) => hasRole(role, p.minRole));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="max-w-xl gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Quick actions</DialogTitle>
        <Command label="Quick actions" className="bg-transparent">
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4 text-fg-subtle" />
            <Command.Input
              placeholder="Jump to a page, action, or product…"
              className="h-12 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            <kbd className="hidden font-mono text-[10px] text-fg-subtle sm:inline">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-fg-muted">
              No results.
            </Command.Empty>
            <Command.Group
              heading="Quick actions"
              className="px-1 pb-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle"
            >
              {actions.map((a) => {
                const Icon = iconFor(a.icon);
                return (
                  <Command.Item
                    key={a.href}
                    value={a.label}
                    onSelect={() => run(a.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg",
                      "data-[selected=true]:bg-caramel-100 data-[selected=true]:text-caramel-800",
                    )}
                  >
                    <Icon className="size-4" />
                    {a.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group
              heading="Pages"
              className="px-1 pt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-fg-subtle"
            >
              {pages.map((p) => {
                const Icon = iconFor(p.icon);
                return (
                  <Command.Item
                    key={p.href}
                    value={p.label}
                    onSelect={() => run(p.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg",
                      "data-[selected=true]:bg-cream-100",
                    )}
                  >
                    <Icon className="size-4" />
                    {p.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
