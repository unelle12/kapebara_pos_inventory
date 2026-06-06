"use client";

import * as React from "react";
import Link from "next/link";
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
  Package,
  Sliders,
  Trash2,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SkeletonRow } from "~/components/ui/skeleton";
import { TableEmptyState } from "~/components/ui/table-empty-state";
import { StockBadge, type StockStatus } from "~/components/products/stock-badge";
import { cn, formatCurrency } from "~/lib/utils";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  lowStockThreshold: number;
  trackStock: boolean;
  active: boolean;
  updatedAt: Date;
  category: { id: string; name: string; slug: string; color: string | null };
  supplier: { id: string; name: string } | null;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  avgMargin: number;
  variantCount: number;
  stockStatus: StockStatus;
};

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ArrowUp className="size-3" />;
  if (dir === "desc") return <ArrowDown className="size-3" />;
  return <ArrowUpDown className="size-3 opacity-40" />;
}

function CategoryDot({ color }: { color: string | null }) {
  const map: Record<string, string> = {
    caramel: "bg-caramel-500",
    sage: "bg-sage-500",
    clay: "bg-clay-500",
    espresso: "bg-espresso-700",
  };
  const tone = (color && map[color]) ?? "bg-fg-subtle";
  return <span className={cn("size-2 shrink-0 rounded-full", tone)} aria-hidden />;
}

export function ProductsTable({
  initialData,
}: {
  initialData: {
    items: ProductRow[];
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    totalActive: number;
  };
}) {
  const router = useRouterSafe();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const sortBy = (searchParams.get("sortBy") ?? "name") as
    | "name" | "sku" | "category" | "stock" | "margin" | "updated";
  const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === "desc" }];

  const query = api.product.list.useQuery(
    {
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      stockStatus: (searchParams.get("stockStatus") ?? "ALL") as
        | "ALL" | "OK" | "LOW" | "OUT" | "INACTIVE" | "TRACK_OFF",
      sortBy,
      sortDir,
      page,
      pageSize: 20,
    },
    { initialData },
  );

  const data = query.data ?? initialData;

  const columns = React.useMemo<ColumnDef<ProductRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: () => <SortHeader label="Product" sortKey="name" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream-50 text-espresso-700">
                {p.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-full rounded-xl object-contain"
                  />
                ) : (
                  <Package className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{p.name}</p>
                <p className="truncate font-mono text-[11px] text-fg-subtle">{p.sku}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "category",
        accessorFn: (r) => r.category.name,
        header: () => <SortHeader label="Category" sortKey="category" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CategoryDot color={row.original.category.color} />
            <span className="text-fg-muted">{row.original.category.name}</span>
          </div>
        ),
      },
      {
        id: "variants",
        accessorFn: (r) => r.variantCount,
        header: "Variants",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const range =
            p.minPrice === p.maxPrice
              ? formatCurrency(p.minPrice)
              : `${formatCurrency(p.minPrice)}–${formatCurrency(p.maxPrice)}`;
          return (
            <div>
              <p className="text-fg">
                {p.variantCount} {p.variantCount === 1 ? "variant" : "variants"}
              </p>
              <p className="font-mono text-[11px] text-fg-subtle tabular-nums">{range}</p>
            </div>
          );
        },
      },
      {
        id: "stock",
        accessorFn: (r) => r.totalStock,
        header: () => <SortHeader label="Stock" sortKey="stock" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => {
          const p = row.original;
          if (!p.trackStock) {
            return <span className="font-mono text-xs text-fg-subtle">—</span>;
          }
          return (
            <div>
              <p className="font-mono font-medium tabular-nums text-fg">{p.totalStock}</p>
              <p className="font-mono text-[10px] text-fg-subtle">≤ {p.lowStockThreshold}</p>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (r) => r.stockStatus,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          if (!p.active) {
            return <Badge variant="neutral" size="sm">Inactive</Badge>;
          }
          return (
            <StockBadge
              status={p.stockStatus}
              qty={p.trackStock ? p.totalStock : undefined}
            />
          );
        },
      },
      {
        id: "margin",
        accessorFn: (r) => r.avgMargin,
        header: () => <SortHeader label="Margin" sortKey="margin" current={sortBy} dir={sortDir} />,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              row.original.avgMargin >= 50
                ? "text-sage-700"
                : row.original.avgMargin >= 25
                  ? "text-fg"
                  : "text-clay-700",
            )}
          >
            {row.original.avgMargin.toFixed(1)}%
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <RowActions row={row.original} />,
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
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
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
                <SkeletonRow key={i} cols={6} />
              ))
            ) : data.items.length === 0 ? (
              <TableEmptyState
                colSpan={7}
                filtered={Boolean(searchParams.get("search"))}
                title={searchParams.get("search") ? "No matches" : "No products yet"}
                description={
                  searchParams.get("search")
                    ? `Nothing matches “${searchParams.get("search")}”. Try a different term or clear the filters.`
                    : "Add your first product to start stocking the till."
                }
                icon={Package}
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
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
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

function RowActions({ row }: { row: ProductRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem asChild>
          <Link href={`/products/${row.id}`}>
            <Eye className="size-3.5" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/products/${row.id}/edit`}>
            <Edit3 className="size-3.5" />
            Edit product
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/stock?variant=${row.id}`}>
            <Sliders className="size-3.5" />
            Adjust stock
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          className="text-red-700 focus:bg-red-50 focus:text-red-700"
        >
          <Trash2 className="size-3.5" />
          Archive
          <span className="ml-auto font-mono text-[9px] text-fg-subtle">C2</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -- Hook shims (kept here to avoid a 1-line file) -- */
import { useRouter as useNextRouter, useSearchParams as useNextSearchParams } from "next/navigation";

function useRouterSafe() {
  return useNextRouter();
}
function useSearchParams() {
  return useNextSearchParams();
}
