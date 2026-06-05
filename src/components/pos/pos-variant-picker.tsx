"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { formatCurrency, cn } from "~/lib/utils";
import { useCart } from "./cart-store";

type Product = {
  id: string;
  name: string;
  trackStock: boolean;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
};

export function POSVariantPicker({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = product.variants.find((v) => v.id === selectedId) ?? null;

  function handleAdd() {
    if (!selected) return;
    addLine({
      productId: product.id,
      variantId: selected.id,
      productName: product.name,
      variantName: selected.name,
      sku: selected.sku,
      unitPrice: selected.price,
      trackStock: product.trackStock,
      maxStock: product.trackStock ? selected.stock : null,
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Choose variant
          </p>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          {product.variants.map((v) => {
            const outOfStock = product.trackStock && v.stock <= 0;
            const isSelected = selectedId === v.id;
            const attributeEntries = Object.entries(v.attributes);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => !outOfStock && setSelectedId(v.id)}
                disabled={outOfStock}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                  isSelected
                    ? "border-caramel-500 bg-caramel-50"
                    : "border-border bg-surface hover:border-espresso-300",
                  outOfStock && "cursor-not-allowed opacity-40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-espresso-900">
                    {v.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {attributeEntries.map(([k, val]) => (
                      <span
                        key={k}
                        className="rounded-pill bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted"
                      >
                        {k}: {val}
                      </span>
                    ))}
                    {product.trackStock && (
                      <span
                        className={cn(
                          "rounded-pill px-1.5 py-0.5 font-mono text-[10px]",
                          v.stock <= 0
                            ? "bg-red-100 text-red-700"
                            : v.stock <= 5
                              ? "bg-amber-100 text-amber-700"
                              : "bg-sage-100 text-sage-700",
                        )}
                      >
                        stock {v.stock}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-sm font-medium tabular-nums text-espresso-900">
                  {formatCurrency(v.price)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!selected}
            onClick={handleAdd}
          >
            Add to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
