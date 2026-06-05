"use client";

import {
  ArrowLeft,
  Check,
  Loader2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function RestockWizard() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [variantSelections, setVariantSelections] = useState<
    Array<{ variantId: string; quantity: number }>
  >([]);

  const suppliersQuery = api.supplier.active.useQuery();

  const supplierQuery = api.supplier.byId.useQuery(
    { id: supplierId ?? "" },
    { enabled: !!supplierId },
  );

  const products = supplierQuery.data?.products ?? [];

  const adjustMutation = api.stock.adjust.useMutation();

  const handleBack = () => {
    if (step === 1) {
      router.push("/stock");
    } else {
      setStep(step - 1);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!supplierId) return;
      setStep(2);
    } else if (step === 2) {
      const hasSelections = variantSelections.some((sel) => sel.quantity > 0);
      if (!hasSelections) return;
      setStep(3);
    } else if (step === 3) {
      const promises = variantSelections
        .filter((sel) => sel.quantity > 0)
        .map((item) =>
          adjustMutation.mutateAsync({
            variantId: item.variantId,
            qtyChange: item.quantity,
            type: "RESTOCK",
            note: "Restocked from supplier wizard",
          }),
        );
      await Promise.all(promises);
      setStep(1);
      setSupplierId(null);
      setVariantSelections([]);
      router.push("/stock");
    }
  };

  const isRestocking = adjustMutation.isPending;

  if (step === 1) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              Phase C4 · Inventory
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
              Restock inventory
            </h1>
            <p className="mt-1 text-fg-muted">
              Select a supplier, choose variants to restock, and confirm quantities.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/stock">
              <Button variant="outline" size="md">
                <ArrowLeft className="size-4" />
                Back to stock
              </Button>
            </Link>
          </div>
        </section>

        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Truck className="size-5 text-espresso-600" />
              <div>
                <p className="font-mono text-sm text-fg-muted">
                  Select supplier
                </p>
                <select
                  value={supplierId ?? ""}
                  onChange={(e) => setSupplierId(e.target.value || null)}
                  className={cn(
                    "h-10 rounded-xl border border-border-strong bg-surface px-3 text-sm",
                    "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
                  )}
                  disabled={suppliersQuery.isFetching}
                >
                  <option value="">Select a supplier</option>
                  {suppliersQuery.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.contact && ` \u00B7 ${s.contact}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn(
                  "font-mono",
                  s === step
                    ? "text-espresso-900"
                    : s < step
                      ? "text-sage-500"
                      : "text-fg-subtle",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            disabled={!supplierId}
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              Phase C4 · Inventory
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
              Select variants
            </h1>
            <p className="mt-1 text-fg-muted">
              Choose which products to restock.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/restock">
              <Button variant="outline" size="md">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </Link>
          </div>
        </section>

        {supplierQuery.isFetching ? (
          <div className="card p-6 text-center">
            <p className="text-fg-muted">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-fg-muted">
              No products found for this supplier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-cream-50/40">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Current stock
                  </th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Restock qty
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    New stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) =>
                  product.variants.map((variant) => {
                    const currentStock = variant.stock;
                    const selected = variantSelections.find(
                      (sel) => sel.variantId === variant.id,
                    );
                    const quantity = selected?.quantity ?? 0;

                    return (
                      <tr
                        key={variant.id}
                        className="border-b border-border/60"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-fg">
                            {product.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-fg">
                            {variant.name}
                          </p>
                          {variant.sku && (
                            <p className="font-mono text-[11px] text-fg-subtle">
                              {variant.sku}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono tabular-nums text-fg">
                          {currentStock}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={9999}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setVariantSelections((prev) => {
                            const idx = prev.findIndex(
                              (sel) => sel.variantId === variant.id,
                            );
                            if (idx >= 0) {
                              if (val === 0) {
                                const next = [...prev];
                                next.splice(idx, 1);
                                return next;
                              }
                              const next = [...prev];
                              next[idx] = {
                                variantId: variant.id,
                                quantity: val,
                              };
                              return next;
                            }
                                if (val > 0) {
                                  return [
                                    ...prev,
                                    { variantId: variant.id, quantity: val },
                                  ];
                                }
                                return prev;
                              });
                            }}
                            className={cn(
                              "w-full rounded-xl border border-border bg-surface px-2 py-1 text-center",
                              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
                            )}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-fg">
                          {currentStock + quantity}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">
            Total selected:{" "}
            <strong className="text-fg">
              {variantSelections.reduce((sum, sel) => sum + sel.quantity, 0)}
            </strong>{" "}
            units
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={
                variantSelections.filter((s) => s.quantity > 0).length === 0
              }
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const selectedItems = variantSelections.filter((sel) => sel.quantity > 0);
    const totalUnits = selectedItems.reduce(
      (sum, sel) => sum + sel.quantity,
      0,
    );

    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              Phase C4 · Inventory
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
              Review restock
            </h1>
            <p className="mt-1 text-fg-muted">
              Confirm your restock selection before submitting.
            </p>
          </div>
        </section>

        <div className="card p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-sage-600" />
              <p className="font-mono text-sm text-fg-muted">
                Confirm restock
              </p>
            </div>

            {selectedItems.map((item) => {
              const product = products.find((p) =>
                p.variants.some((v) => v.id === item.variantId),
              );
              const variant = products
                .flatMap((p) => p.variants)
                .find((v) => v.id === item.variantId);
              if (!variant || !product) return null;

              const currentStock = variant.stock;

              return (
                <div
                  key={item.variantId}
                  className="border-t border-border pt-3"
                >
                  <p className="flex justify-between text-sm text-fg-muted">
                    {product.name} &middot; {variant.name}
                  </p>
                  <div className="mt-1 flex gap-4 text-xs">
                    <span className="text-fg-muted">Current:</span>
                    <span className="font-mono text-fg">{currentStock}</span>
                    <span className="mx-4 text-fg-muted">&rarr;</span>
                    <span className="text-fg-muted">Add:</span>
                    <span className="font-mono text-sage-600">
                      +{item.quantity}
                    </span>
                    <span className="mx-4 text-fg-muted">&rarr;</span>
                    <span className="text-fg-muted">New:</span>
                    <span className="font-mono text-fg">
                      {currentStock + item.quantity}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="border-t border-border pt-4">
              <p className="font-mono text-xs text-fg-muted">
                Total units to restock:
              </p>
              <p className="mt-1 font-mono text-lg text-fg">{totalUnits}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" size="md" onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isRestocking}
              onClick={handleNext}
            >
              {isRestocking ? (
                <>
                  <Loader2 className="mr-2 size-4" />
                  Restocking&hellip;
                </>
              ) : (
                "Confirm restock"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
