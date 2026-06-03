import {
  BarChart3,
  Bell,
  Boxes,
  type LucideIcon,
  History,
  LayoutDashboard,
  Package,
  PackageOpen,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

import { hasRole, type Role } from "~/lib/permissions";

export type IconName =
  | "BarChart3"
  | "Bell"
  | "Boxes"
  | "History"
  | "LayoutDashboard"
  | "Package"
  | "PackageOpen"
  | "Settings"
  | "ShoppingCart"
  | "Truck"
  | "Users";

const ICONS: Record<IconName, LucideIcon> = {
  BarChart3,
  Bell,
  Boxes,
  History,
  LayoutDashboard,
  Package,
  PackageOpen,
  Settings,
  ShoppingCart,
  Truck,
  Users,
};

/** Resolve an icon name (string) to the actual Lucide component. */
export function iconFor(name: IconName): LucideIcon {
  return ICONS[name];
}

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  /** Small badge shown next to the label (e.g. notification count). */
  badgeKey?: "lowStock";
  /** Minimum role required to see this item. */
  minRole: Role;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", minRole: "CASHIER" },
    ],
  },
  {
    title: "Sell",
    items: [
      { label: "Point of Sale", href: "/pos", icon: "ShoppingCart", minRole: "CASHIER" },
      { label: "Sales History", href: "/sales", icon: "History", minRole: "CASHIER" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", href: "/products", icon: "Package", minRole: "MANAGER" },
      { label: "Stock", href: "/stock", icon: "Boxes", minRole: "MANAGER", badgeKey: "lowStock" },
      { label: "Suppliers", href: "/suppliers", icon: "Truck", minRole: "MANAGER" },
      { label: "Restock", href: "/restock", icon: "PackageOpen", minRole: "MANAGER" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: "BarChart3", minRole: "MANAGER" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Users", href: "/users", icon: "Users", minRole: "OWNER" },
      { label: "Settings", href: "/settings", icon: "Settings", minRole: "OWNER" },
    ],
  },
];

export type QuickAction = {
  label: string;
  href: string;
  icon: IconName;
  minRole: Role;
};

/** Quick links shown in the command palette. */
export const QUICK_ACTIONS: QuickAction[] = [
  { label: "New sale — open POS", href: "/pos", icon: "ShoppingCart", minRole: "CASHIER" },
  { label: "Add product", href: "/products/new", icon: "Package", minRole: "MANAGER" },
  { label: "Restock inventory", href: "/restock", icon: "PackageOpen", minRole: "MANAGER" },
  { label: "View reports", href: "/reports", icon: "BarChart3", minRole: "MANAGER" },
  { label: "Manage users", href: "/users", icon: "Users", minRole: "OWNER" },
  { label: "View low-stock alerts", href: "/stock?filter=low", icon: "Bell", minRole: "MANAGER" },
  { label: "Add supplier", href: "/suppliers/new", icon: "Truck", minRole: "MANAGER" },
  { label: "Settings", href: "/settings", icon: "Settings", minRole: "OWNER" },
];

/** Filter sections based on the user's role. */
export function visibleSections(role: Role): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => hasRole(role, i.minRole)),
    }))
    .filter((s) => s.items.length > 0);
}
