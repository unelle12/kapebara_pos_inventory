"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  KeyRound,
  MoreHorizontal,
  Power,
  PowerOff,
  UserCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SkeletonRow } from "~/components/ui/skeleton";
import { TableEmptyState } from "~/components/ui/table-empty-state";
import { RoleBadge, initialsFor } from "./role-badge";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { UserRole } from "../../../generated/prisma";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  saleCount: number;
  movementCount: number;
  refundCount: number;
};

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="size-3" />;
  if (dir === "desc") return <ArrowDown className="size-3" />;
  return <ArrowUpDown className="size-3 opacity-40" />;
}

export function UsersTable({
  initialData,
  currentUserId,
}: {
  initialData: {
    items: UserRow[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resetFor, setResetFor] = React.useState<{ id: string; name: string } | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const sortBy = (searchParams.get("sortBy") ?? "name") as
    | "name" | "email" | "role" | "createdAt";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

  const query = api.user.list.useQuery(
    {
      search: searchParams.get("search") ?? undefined,
      role: (searchParams.get("role") as UserRole | null) ?? undefined,
      active:
        searchParams.get("active") === "true"
          ? true
          : searchParams.get("active") === "false"
            ? false
            : undefined,
      sortBy,
      sortDir,
      page,
      pageSize: 20,
    },
    { initialData },
  );

  const utils = api.useUtils();
  const toggleActive = api.user.toggleActive.useMutation({
    onSuccess: (u) => {
      toast.success(u.active ? `${u.name} reactivated` : `${u.name} deactivated`);
      void utils.user.list.invalidate();
      void utils.user.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const data = query.data ?? initialData;

  const columns = React.useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: () => <SortHeader label="User" sortKey="name" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.id === currentUserId;
          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                  u.role === UserRole.OWNER
                    ? "bg-espresso-100 text-espresso-800"
                    : u.role === UserRole.MANAGER
                      ? "bg-caramel-100 text-caramel-800"
                      : "bg-sage-100 text-sage-700",
                )}
              >
                {initialsFor(u.name, u.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">
                  {u.name}
                  {isSelf && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                      you
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-fg-muted">{u.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorKey: "role",
        header: () => <SortHeader label="Role" sortKey="role" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: "saleCount",
        accessorKey: "saleCount",
        header: "Activity",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="font-mono text-xs text-fg-muted">
              <span className="text-fg">{u.saleCount}</span> sales
              {u.refundCount > 0 && (
                <>
                  <span className="mx-1.5 text-fg-subtle">·</span>
                  <span className="text-fg">{u.refundCount}</span> refund
                  {u.refundCount === 1 ? "" : "s"}
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: () => <SortHeader label="Member since" sortKey="createdAt" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <span className="text-sm text-fg-muted">
              {d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          );
        },
      },
      {
        id: "active",
        accessorKey: "active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <Badge variant={u.active ? "sage" : "neutral"} size="sm">
              {u.active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <UserRowActions row={row.original} currentUserId={currentUserId} onResetPassword={(u) => setResetFor(u)} onToggleActive={(id) => toggleActive.mutate({ id })} />,
      },
    ],
    [sortBy, sortDir, toggleActive, currentUserId],
  );

  const table = useReactTable({
    data: data.items,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (first) {
        updateParams({ sortBy: first.id, sortDir: first.desc ? "desc" : "asc", page: null });
      }
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    const qs = params.toString();
    router.replace(qs ? `/users?${qs}` : "/users", { scroll: false });
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-cream-50/40 text-left">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle"
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {query.isFetching && data.items.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={5} />
                ))
              ) : data.items.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  filtered={Boolean(searchParams.get("search"))}
                  title={searchParams.get("search") ? "No matches" : "No users yet"}
                  description={
                    searchParams.get("search")
                      ? `Nothing matches “${searchParams.get("search")}”. Try a different term or clear the filters.`
                      : "Add your first staff member to get started."
                  }
                  icon={Users}
                  onClear={() => updateParams({ search: null, role: null, active: null, page: null })}
                />
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-border/60 transition-colors hover:bg-cream-50/40 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-border bg-cream-50/40 px-4 py-3 text-xs text-fg-muted sm:flex-row sm:items-center">
          <p>
            <span className="font-mono uppercase tracking-wider text-fg-subtle">page</span>{" "}
            <span className="text-fg">{data.page}</span>{" "}
            <span className="text-fg-subtle">of</span>{" "}
            <span className="text-fg">{data.pageCount}</span>{" "}
            <span className="text-fg-subtle">·</span>{" "}
            <span className="text-fg">{data.total}</span>{" "}
            <span className="text-fg-subtle">total</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || query.isFetching}
              onClick={() => updateParams({ page: String(data.page - 1) })}
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.pageCount || query.isFetching}
              onClick={() => updateParams({ page: String(data.page + 1) })}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {resetFor && (
        <ResetPasswordDialog
          userId={resetFor.id}
          userName={resetFor.name}
          open
          onOpenChange={(o) => {
            if (!o) setResetFor(null);
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function SortHeader({
  label,
  sortKey,
  current,
  dir,
}: {
  label: string;
  sortKey: string;
  current: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isActive = current === sortKey;

  function onClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.set("sortDir", dir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortKey);
      params.set("sortDir", "asc");
    }
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `/users?${qs}` : "/users", { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-cream-100",
        isActive && "text-fg",
      )}
    >
      {label}
      <SortIcon dir={isActive ? dir : false} />
    </button>
  );
}

function UserRowActions({
  row,
  currentUserId,
  onResetPassword,
  onToggleActive,
}: {
  row: UserRow;
  currentUserId: string;
  onResetPassword: (u: { id: string; name: string }) => void;
  onToggleActive: (id: string) => void;
}) {
  const isSelf = row.id === currentUserId;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem asChild>
          <Link href={`/users/${row.id}`}>
            <UserCircle className="size-3.5" />
            View profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/users/${row.id}/edit`}>
            <Edit3 className="size-3.5" />
            Edit user
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onResetPassword({ id: row.id, name: row.name })}>
          <KeyRound className="size-3.5" />
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onToggleActive(row.id)}
          disabled={isSelf}
          className={cn(
            row.active ? "text-red-700 focus:bg-red-50 focus:text-red-700" : "text-sage-700 focus:bg-sage-50 focus:text-sage-700",
            isSelf && "opacity-40",
          )}
        >
          {row.active ? (
            <>
              <PowerOff className="size-3.5" />
              Deactivate
              {isSelf && <span className="ml-auto font-mono text-[9px] text-fg-subtle">self</span>}
            </>
          ) : (
            <>
              <Power className="size-3.5" />
              Reactivate
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
