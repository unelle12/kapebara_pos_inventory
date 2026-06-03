"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { iconFor, type NavSection } from "~/lib/nav";
import { Logo } from "~/components/brand/logo";
import { cn } from "~/lib/utils";

export function MobileNav({
  open,
  onClose,
  sections,
  badges,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
  badges: Record<string, number>;
}) {
  const pathname = usePathname();

  React.useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-espresso-950/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-cream-100 hover:text-fg"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="h-[calc(100dvh-4rem)] overflow-y-auto px-2.5 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              <p className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard");
                  const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                  const Icon = iconFor(item.icon);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium",
                          active
                            ? "bg-caramel-100 text-caramel-800"
                            : "text-fg-muted hover:bg-cream-100 hover:text-fg",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[18px]",
                            active ? "text-caramel-700" : "text-fg-subtle",
                          )}
                        />
                        {item.label}
                        {badge !== undefined && badge > 0 && (
                          <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-clay-500 px-1.5 text-[10px] font-semibold text-white">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
