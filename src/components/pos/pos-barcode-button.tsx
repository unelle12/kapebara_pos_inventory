"use client";

import { Camera, ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useCart } from "./cart-store";

/**
 * Placeholder for the camera barcode scanner. Currently uses the
 * `findByVariantSku` query to look up by typed/scanned SKU.
 *
 * TODO(D2): wire up @zxing/browser to actually read from a camera stream.
 */
export function POSBarcodeButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [sku, setSku] = useState("");

  const lookup = api.pos.findByVariantSku.useQuery(
    { sku },
    { enabled: false },
  );
  const { addLine } = useCart();

  async function handleSubmit() {
    if (!sku.trim()) return;
    const result = await lookup.refetch();
    const found = result.data;
    if (!found) {
      toast.error("SKU not found");
      return;
    }
    if (found.stock <= 0) {
      toast.error(`${found.product.name} (${found.variantName}) is out of stock`);
      return;
    }
    addLine({
      productId: found.product.id,
      variantId: found.variantId,
      productName: found.product.name,
      variantName: found.variantName,
      sku: found.variantSku,
      unitPrice: found.price,
      trackStock: found.product.trackStock,
      maxStock: found.stock,
    });
    toast.success(`Added ${found.product.name}`);
    setSku("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              <ScanLine className="size-4 text-caramel-600" />
              Scan or enter SKU
            </span>
          </DialogTitle>
          <DialogDescription>
            Type a product or variant SKU and press Enter to add it to the cart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-caramel-300 bg-caramel-50/40">
            <div className="text-center text-fg-muted">
              <Camera className="mx-auto size-10 text-caramel-500" />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider">
                Camera scanner (D2)
              </p>
              <p className="mt-1 text-xs text-fg-subtle">
                @zxing/browser integration coming
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. KP-CAP-001"
              className="h-10 flex-1 rounded-xl border border-border-strong bg-surface px-3 font-mono text-sm uppercase outline-none focus:border-caramel-500 focus:ring-2 focus:ring-caramel-200"
            />
            <Button type="submit" variant="primary" size="md" disabled={lookup.isFetching}>
              {lookup.isFetching ? "Looking up…" : "Add"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
