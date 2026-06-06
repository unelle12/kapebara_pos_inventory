"use client";

import { Coffee, Loader2, Package } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { formatCurrency, cn } from "~/lib/utils";
import { useCart } from "./cart-store";
import { POSVariantPicker } from "./pos-variant-picker";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  trackStock: boolean;
  category: { id: string; name: string; color: string | null };
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  variantCount: number;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
};

export function POSProductGrid({
  products,
  isLoading,
  search,
}: {
  products: Product[];
  isLoading: boolean;
  search: string;
}) {
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const { addLine } = useCart();

  function handleClick(p: Product) {
    if (p.variantCount === 0) return; // can't sell a product with no active variants
    if (p.variantCount === 1) {
      // single-variant — add directly
      const v = p.variants[0]!;
      addLine({
        productId: p.id,
        variantId: v.id,
        productName: p.name,
        variantName: v.name,
        sku: v.sku,
        unitPrice: v.price,
        trackStock: p.trackStock,
        maxStock: p.trackStock ? v.stock : null,
      });
      return;
    }
    setPickerProduct(p);
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="card flex h-72 items-center justify-center text-fg-muted">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading products…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="card flex h-72 flex-col items-center justify-center gap-2 text-center">
        <Package className="size-8 text-fg-subtle" />
        <p className="font-display text-lg text-espresso-900">
          {search ? "No matches" : "No products in this category"}
        </p>
        <p className="text-sm text-fg-muted">
          {search
            ? `Nothing matches “${search}”. Try a different term.`
            : "Add products from the Inventory page."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => {
          const outOfStock = p.trackStock && p.totalStock <= 0;
          const isMultiVariant = p.variantCount > 1;
          const hasRange = p.minPrice !== p.maxPrice;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleClick(p)}
              disabled={outOfStock}
              className={cn(
                "group relative flex flex-col items-stretch gap-2 rounded-2xl border border-border bg-surface p-3 text-left transition-all",
                "hover:-translate-y-0.5 hover:border-espresso-300 hover:shadow-md",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel-400",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
              )}
            >
              <div className="flex h-20 items-center justify-center rounded-xl bg-cream-50 text-espresso-600">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-full rounded-xl object-contain"
                  />
                ) : (
                  <Coffee className="size-8" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="line-clamp-2 text-sm font-medium leading-tight text-espresso-900">
                  {p.name}
                </p>
                <p className="font-mono text-[10px] text-fg-subtle">
                  {p.sku}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-medium tabular-nums text-espresso-900">
                  {hasRange
                    ? `${formatCurrency(p.minPrice)} – ${formatCurrency(p.maxPrice)}`
                    : formatCurrency(p.minPrice)}
                </p>
                {isMultiVariant && (
                  <Badge variant="neutral" size="sm">
                    {p.variantCount}
                  </Badge>
                )}
              </div>
              {outOfStock && (
                <span className="absolute right-2 top-2 rounded-pill bg-red-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-700">
                  Out
                </span>
              )}
            </button>
          );
        })}
      </div>

      {pickerProduct && (
        <POSVariantPicker
          product={pickerProduct}
          onClose={() => setPickerProduct(null)}
        />
      )}
    </>
  );
}
