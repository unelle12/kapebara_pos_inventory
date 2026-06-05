"use client";

import { useState } from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { api } from "~/trpc/react";
import { POSCategoryChips } from "./pos-category-chips";
import { POSProductGrid } from "./pos-product-grid";
import { POSProductSearch } from "./pos-product-search";
import { POSCartPanel } from "./pos-cart-panel";
import { POSBarcodeButton } from "./pos-barcode-button";
import { POSHeldSales } from "./pos-held-sales";

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  slug: string;
  productCount: number;
};

export function POSTerminal({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 200);

  const query = api.pos.list.useQuery({
    search: debouncedSearch || undefined,
    categoryId: categoryId ?? undefined,
    page: 1,
    pageSize: 60,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      {/* Left column: product browse */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <POSProductSearch
              value={search}
              onChange={setSearch}
              onScan={() => setScannerOpen(true)}
            />
          </div>
          <POSBarcodeButton
            open={scannerOpen}
            onOpenChange={setScannerOpen}
          />
        </div>

        <POSCategoryChips
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        <POSProductGrid
          products={query.data?.items ?? []}
          isLoading={query.isFetching}
          search={search}
        />
      </div>

      {/* Right column: cart */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <POSCartPanel />
        <POSHeldSales />
      </aside>
    </div>
  );
}
