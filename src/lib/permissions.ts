import { type UserRole } from "../../generated/prisma";

/**
 * Role hierarchy & helpers. Higher = more privileged.
 * CASHIER  → POS only
 * MANAGER  → + inventory, reports, products, suppliers
 * OWNER    → + users, settings
 */
export const ROLES = ["CASHIER", "MANAGER", "OWNER"] as const;
export type Role = UserRole;

const RANK: Record<Role, number> = {
  CASHIER: 1,
  MANAGER: 2,
  OWNER: 3,
};

export function roleRank(role: Role): number {
  return RANK[role];
}

export function hasRole(actual: Role, required: Role): boolean {
  return RANK[actual] >= RANK[required];
}

export function isManagerOrAbove(role: Role) {
  return hasRole(role, "MANAGER");
}

export function isOwner(role: Role) {
  return role === "OWNER";
}

export const ROLE_LABELS: Record<Role, string> = {
  CASHIER: "Cashier",
  MANAGER: "Manager",
  OWNER: "Owner",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  CASHIER: "Handles sales at the POS.",
  MANAGER:
    "Inventory, products, suppliers, reports — everything except users.",
  OWNER: "Full access including users and settings.",
};
