"use client";

import {
  CreditCard,
  Minus,
  Pause,
  Plus,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/utils";
import { useCart } from "./cart-store";
import { CheckoutDialog } from "./checkout-dialog";

export function POSCartPanel() {
  const { state, totals, inc, dec, setQty, remove, setDiscount, setCustomer, clear, hold } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const empty = state.lines.length === 0;

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-cream-50/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-espresso-600" />
          <h2 className="font-display text-base font-medium text-espresso-900">
            Cart
          </h2>
          {totals.itemCount > 0 && (
            <span className="rounded-pill bg-espresso-700 px-1.5 py-0.5 font-mono text-[10px] text-cream-50">
              {totals.itemCount}
            </span>
          )}
        </div>
        {!empty && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-fg-muted transition-colors hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Customer */}
      <div className="border-b border-border px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          <User className="size-3.5" />
          <span className="font-mono uppercase tracking-wider">customer</span>
          <input
            value={state.customerName}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Walk-in"
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
        </label>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 28rem)" }}>
        {empty ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
            <ShoppingCart className="size-6 text-fg-subtle" />
            <p className="text-sm text-fg-muted">Cart is empty</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              tap a product to begin
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {state.lines.map((l) => (
              <li key={l.lineId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-espresso-900">
                      {l.productName}
                    </p>
                    {l.variantName && (
                      <p className="text-xs text-fg-muted">{l.variantName}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] text-fg-subtle">
                      {l.sku}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.lineId)}
                    className="text-fg-subtle transition-colors hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => dec(l.lineId)}
                      className="flex size-7 items-center justify-center text-fg-muted transition-colors hover:bg-cream-100 hover:text-fg"
                      aria-label="Decrease"
                    >
                      <Minus className="size-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={l.maxStock ?? 9999}
                      value={l.qty}
                      onChange={(e) =>
                        setQty(l.lineId, parseInt(e.target.value) || 0)
                      }
                      className="w-12 border-x border-border bg-transparent text-center font-mono text-sm tabular-nums outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => inc(l.lineId)}
                      disabled={
                        l.maxStock !== null && l.qty >= l.maxStock
                      }
                      className="flex size-7 items-center justify-center text-fg-muted transition-colors hover:bg-cream-100 hover:text-fg disabled:opacity-30"
                      aria-label="Increase"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium tabular-nums text-espresso-900">
                      {formatCurrency(l.unitPrice * l.qty)}
                    </p>
                    <p className="font-mono text-[10px] text-fg-subtle">
                      {formatCurrency(l.unitPrice)} ea
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-border bg-cream-50/40 px-4 py-3 text-sm">
        <div className="flex items-center justify-between text-fg-muted">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-fg-muted">
          <span className="shrink-0">Discount</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-fg-subtle">₱</span>
            <input
              type="number"
              min={0}
              step={1}
              value={state.discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-20 rounded-md border border-border bg-surface px-1.5 py-0.5 text-right font-mono text-sm tabular-nums outline-none focus:border-caramel-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 font-display text-base">
          <span className="text-espresso-900">Total</span>
          <span className="font-mono text-lg font-medium tabular-nums text-espresso-900">
            {formatCurrency(totals.total)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
        <Button
          variant="outline"
          size="md"
          disabled={empty}
          onClick={hold}
          className="w-full"
        >
          <Pause className="size-4" />
          Hold
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={empty}
          onClick={() => setCheckoutOpen(true)}
          className="w-full"
        >
          <CreditCard className="size-4" />
          Checkout
        </Button>
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
