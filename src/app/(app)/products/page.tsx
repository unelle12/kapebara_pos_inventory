import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { Button } from "~/components/ui/button";
import { ProductsTable } from "~/components/products/products-table";
import { ProductsToolbar } from "~/components/products/products-toolbar";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Products · Kapabara",
};

type SearchParams = Promise<{
  search?: string;
  categoryId?: string;
  stockStatus?: string;
  sortBy?: string;
  sortDir?: string;
  page?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("MANAGER");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") ?? 1);

  // Single round-trip fetches both the products list and the category list
  // for the filter dropdown. Public categories can be cached; the list call
  // is auth-scoped per request.
  const [initialData, categories] = await Promise.all([
    api.product.list({
      search: sp.search ?? undefined,
      categoryId: sp.categoryId ?? undefined,
      stockStatus: (sp.stockStatus as
        | "ALL" | "OK" | "LOW" | "OUT" | "INACTIVE" | "TRACK_OFF"
        | undefined) ?? "ALL",
      sortBy: (sp.sortBy as
        | "name" | "sku" | "category" | "stock" | "margin" | "updated"
        | undefined) ?? "name",
      sortDir: (sp.sortDir as "asc" | "desc" | undefined) ?? "asc",
      page,
      pageSize: 20,
    }),
    api.product.categories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase C1 · Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Products
          </h1>
          <p className="mt-1 text-fg-muted">
            <strong className="text-fg">{initialData.totalActive}</strong>{" "}
            {initialData.totalActive === 1 ? "product" : "products"} in the catalog
            {initialData.total !== initialData.totalActive && (
              <> · showing <strong className="text-fg">{initialData.total}</strong> matching filters</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products/new">
            <Button variant="primary" size="lg">
              <Plus className="size-5" />
              Add product
            </Button>
          </Link>
        </div>
      </section>

      {/* Toolbar */}
      <ProductsToolbar categories={categories} total={initialData.total} />

      {/* Table */}
      <ProductsTable initialData={initialData} />

      {/* Phase note */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-cream-50/40 p-4 text-sm text-fg-muted">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-caramel-100 text-caramel-700">
          <Package className="size-4" />
        </div>
        <div>
          <p className="font-medium text-fg">Catalog summary</p>
          <p className="mt-0.5">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
            {" · "}
            {categories.reduce((s, c) => s + c._count.products, 0)} linked products
          </p>
        </div>
      </div>
    </div>
  );
}
