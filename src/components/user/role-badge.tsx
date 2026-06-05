import { UserRole } from "../../../generated/prisma";
import { Badge } from "~/components/ui/badge";

const ROLE_BADGE: Record<UserRole, { variant: "espresso" | "caramel" | "sage" | "neutral"; label: string }> = {
  [UserRole.OWNER]: { variant: "espresso", label: "Owner" },
  [UserRole.MANAGER]: { variant: "caramel", label: "Manager" },
  [UserRole.CASHIER]: { variant: "sage", label: "Cashier" },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_BADGE[role];
  return (
    <Badge variant={meta.variant} size="sm">
      {meta.label}
    </Badge>
  );
}

/** Returns the user's initials (max 2 chars) for the avatar circle. */
export function initialsFor(name: string | null | undefined, email?: string | null): string {
  const source = (name ?? email ?? "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) {
    return (parts[0] ?? "").slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
