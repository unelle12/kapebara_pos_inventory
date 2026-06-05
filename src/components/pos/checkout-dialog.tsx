"use client";

import {
  Banknote,
  CreditCard,
  Loader2,
  Receipt,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { formatCurrency, cn } from "~/lib/utils";
import { useCart } from "./cart-store";
import { CheckoutSuccess } from "./checkout-success";

type PaymentMethod = "CASH" | "CARD" | "EWALLET";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { state, totals, clear } = useCart();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [tendered, setTendered] = useState<string>("");
  const [completedSale, setCompletedSale] = useState<unknown>(null);

  const utils = api.useUtils();
  const checkout = api.sale.checkout.useMutation({
    onSuccess: (sale) => {
      setCompletedSale(sale);
      clear();
      // Refresh anything that depends on stock / sales.
      void utils.product.list.invalidate();
      void utils.stock.list.invalidate();
      void utils.dashboard.kpis.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Pre-fill tendered with exact total for non-cash methods.
  useEffect(() => {
    if (method !== "CASH") {
      setTendered(totals.total.toFixed(2));
    } else if (tendered === "" || parseFloat(tendered) < totals.total) {
      setTendered(totals.total.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, totals.total]);

  // Reset state when dialog opens/closes.
  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setTendered(totals.total.toFixed(2));
      setCompletedSale(null);
    }
  }, [open, totals.total]);

  const tenderedNum = parseFloat(tendered) || 0;
  const change = method === "CASH" ? Math.max(0, tenderedNum - totals.total) : 0;
  const canPay =
    state.lines.length > 0 &&
    totals.total > 0 &&
    (method !== "CASH" || tenderedNum >= totals.total);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setCompletedSale(null);
    }
    onOpenChange(o);
  }

  function handleConfirm() {
    if (!canPay) return;
    checkout.mutate({
      lines: state.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        variantName: l.variantName,
        sku: l.sku,
        qty: l.qty,
        unitPrice: l.unitPrice,
      })),
      discount: state.discount,
      paymentMethod: method,
      amountTendered: method === "CASH" ? tenderedNum : undefined,
    });
  }

  return (
    <Dialog
      open={open || completedSale !== null}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {completedSale ? (
              <span className="inline-flex items-center gap-2">
                <Receipt className="size-4 text-sage-600" />
                Sale complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Wallet className="size-4 text-caramel-600" />
                Checkout
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {completedSale ? (
          <CheckoutSuccess
            sale={completedSale as never}
            onNewSale={() => {
              setCompletedSale(null);
              onOpenChange(false);
            }}
          />
        ) : (
          <div className="space-y-4">
          {/* Payment method */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Payment method
            </p>
            <div className="grid grid-cols-3 gap-2">
              <MethodButton
                active={method === "CASH"}
                onClick={() => setMethod("CASH")}
                icon={<Banknote className="size-5" />}
                label="Cash"
              />
              <MethodButton
                active={method === "CARD"}
                onClick={() => setMethod("CARD")}
                icon={<CreditCard className="size-5" />}
                label="Card"
              />
              <MethodButton
                active={method === "EWALLET"}
                onClick={() => setMethod("EWALLET")}
                icon={<Smartphone className="size-5" />}
                label="E-Wallet"
              />
            </div>
          </div>

          {/* Cash tendered */}
          {method === "CASH" && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                Cash tendered
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 py-2 focus-within:border-caramel-500 focus-within:ring-2 focus-within:ring-caramel-200">
                <span className="font-mono text-lg text-fg-subtle">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-medium tabular-nums text-espresso-900 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTendered(amt.toString())}
                    className="rounded-pill border border-border bg-surface px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-espresso-300 hover:bg-cream-50"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTendered(totals.total.toFixed(2))}
                  className="rounded-pill border border-caramel-300 bg-caramel-50 px-2.5 py-1 font-mono text-xs text-caramel-700 transition-colors hover:bg-caramel-100"
                >
                  Exact
                </button>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1.5 rounded-xl bg-cream-50/60 p-3 text-sm">
            <Row label="Subtotal" value={formatCurrency(totals.subtotal)} muted />
            {state.discount > 0 && (
              <Row
                label="Discount"
                value={`-${formatCurrency(state.discount)}`}
                muted
                tone="sage"
              />
            )}
            <Row
              label="Total"
              value={formatCurrency(totals.total)}
              large
            />
            {method === "CASH" && change > 0 && (
              <Row
                label="Change"
                value={formatCurrency(change)}
                large
                tone="sage"
              />
            )}
          </div>

          {/* Action */}
          <Button
            variant="primary"
            size="lg"
            disabled={!canPay || checkout.isPending}
            onClick={handleConfirm}
            className="w-full"
          >
            {checkout.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Receipt className="size-4" />
                Confirm sale · {formatCurrency(totals.total)}
              </>
            )}
          </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
        active
          ? "border-espresso-700 bg-espresso-700 text-cream-50 shadow-sm"
          : "border-border bg-surface text-fg-muted hover:border-espresso-300 hover:bg-cream-50",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Row({
  label,
  value,
  muted,
  large,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  large?: boolean;
  tone?: "sage";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        large && "border-t border-border pt-1.5",
      )}
    >
      <span
        className={cn(
          muted ? "text-fg-muted" : "text-espresso-900",
          large && "font-medium",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          large ? "text-lg font-medium" : "text-sm",
          tone === "sage" ? "text-sage-700" : "text-espresso-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}
