"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter as useNextRouter, useSearchParams as useNextSearchParams } from "next/navigation";
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
  Eye,
  MoreHorizontal,
  Trash2,
  Truck,
} from "lucide-react";

import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { SkeletonRow } from "~/components/ui/skeleton";
import { TableEmptyState } from "~/components/ui/table-empty-state";
type SupplierRow = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
};

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="size-3" />;
  if (dir === "desc") return <ArrowDown className="size-3" />;
  return <ArrowUpDown className="size-3 opacity-40" />;
}

export function SuppliersTable({
  initialData,
}: {
  initialData: {
    items: SupplierRow[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}) {
  const router = useRouterSafe();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const sortBy = (searchParams.get("sortBy") ?? "name") as
    | "name" | "contact" | "createdAt";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

  const query = api.supplier.list.useQuery(
    {
      search: searchParams.get("search") ?? undefined,
      active: searchParams.get("active") === "false" ? false : undefined,
      sortBy,
      sortDir,
      page,
      pageSize: 20,
    },
    { initialData },
  );

  const data = query.data ?? initialData;

  const columns = React.useMemo<ColumnDef<SupplierRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: () => <SortHeader label="Supplier" sortKey="name" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium text-fg">{s.name}</p>
              {s.contact && (
                <p className="text-xs text-fg-muted">{s.contact}</p>
              )}
            </div>
          );
        },
      },
      {
        id: "contact",
        accessorKey: "contact",
        header: () => <SortHeader label="Contact" sortKey="contact" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const s = row.original;
          return s.contact ? <span className="text-fg-muted">{s.contact}</span> : <span className="text-fg-muted">—</span>;
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: () => <SortHeader label="Email" sortKey="email" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const s = row.original;
          return s.email ? (
            <a href={`mailto:${s.email}`} className="text-fg-hover underline-offset-2 hover:underline">
              {s.email}
            </a>
          ) : <span className="text-fg-muted">—</span>;
        },
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: () => <SortHeader label="Phone" sortKey="phone" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const s = row.original;
          return s.phone ? <span className="text-fg-muted">{s.phone}</span> : <span className="text-fg-muted">—</span>;
        },
      },
      {
        id: "address",
        accessorKey: "address",
        header: "Address",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return s.address ? (
            <span className="text-fg-muted line-clamp-2">{s.address}</span>
          ) : <span className="text-fg-muted">—</span>;
        },
      },
      {
        id: "productCount",
        accessorKey: "productCount",
        header: () => <SortHeader label="Products" sortKey="productCount" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <span className="font-mono text-sm text-fg">
              {s.productCount} {s.productCount === 1 ? "product" : "products"}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorKey: "active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <Badge
              variant={s.active ? "sage" : "neutral"}
              size="sm"
            >
              {s.active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <SupplierRowActions row={row.original} />,
      },
    ],
    [sortBy, sortDir],
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
    router.replace(qs ? `/suppliers?${qs}` : "/suppliers", { scroll: false });
  }

  return (
    <div className="card overflow-hidden">
      {/* Table */}
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
                title={searchParams.get("search") ? "No matches" : "No suppliers yet"}
                description={
                  searchParams.get("search")
                    ? `Nothing matches “${searchParams.get("search")}”. Try a different term or clear the filters.`
                    : "Add your first supplier to start managing inventory."
                }
                icon={Truck}
                onClear={() => updateParams({ search: null, page: null })}
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

      {/* Pagination footer */}
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
  const router = useRouterSafe();
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
    router.replace(qs ? `/suppliers?${qs}` : "/suppliers", { scroll: false });
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

function SupplierRowActions({ row }: { row: SupplierRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem asChild>
          <Link href={`/suppliers/${row.id}`}>
            <Eye className="size-3.5" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/suppliers/${row.id}/edit`}>
            <Edit3 className="size-3.5" />
            Edit supplier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          className="text-red-700 focus:bg-red-50 focus:text-red-700"
        >
          <Trash2 className="size-3.5" />
          Archive
          <span className="ml-auto font-mono text-[9px] text-fg-subtle">C4</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -- Hook shims (kept here to avoid a 1-line file) -- */

function useRouterSafe() {
  return useNextRouter();
}
function useSearchParams() {
  return useNextSearchParams();
}