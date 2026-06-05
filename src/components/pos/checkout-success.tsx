"use client";

import { Check, Plus, Printer } from "lucide-react";

import { Button } from "~/components/ui/button";
import { formatCurrency, formatTime } from "~/lib/utils";

type SaleResult = {
  id: string;
  reference: string;
  total: number;
  change: number | null;
  paymentMethod: "CASH" | "CARD" | "EWALLET";
  amountTendered: number | null;
  subtotal: number;
  discount: number;
  createdAt: Date;
  cashier: { name: string };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

const METHOD_LABELS: Record<SaleResult["paymentMethod"], string> = {
  CASH: "Cash",
  CARD: "Card",
  EWALLET: "E-Wallet",
};

export function CheckoutSuccess({
  sale,
  onNewSale,
}: {
  sale: SaleResult;
  onNewSale: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-sage-50 p-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-sage-500 text-cream-50">
          <Check className="size-6" />
        </div>
        <p className="font-display text-lg font-medium text-espresso-900">
          {formatCurrency(sale.total)} paid
        </p>
        <p className="font-mono text-xs text-fg-muted">{sale.reference}</p>
      </div>

      {/* Receipt */}
      <div className="rounded-2xl border border-border bg-cream-50/40 p-4 font-mono text-xs">
        <div className="space-y-0.5 text-center">
          <p className="font-display text-base font-medium text-espresso-900">
            Kapabara
          </p>
          <p className="text-fg-subtle">123 Capybara Lane · Cebu City</p>
        </div>
        <hr className="my-2 border-dashed border-border" />
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-fg-muted">Ref</span>
            <span>{sale.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Date</span>
            <span>
              {new Date(sale.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {formatTime(sale.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Cashier</span>
            <span>{sale.cashier.name}</span>
          </div>
        </div>
        <hr className="my-2 border-dashed border-border" />
        <div className="space-y-1.5">
          {sale.items.map((it) => (
            <div key={it.id} className="space-y-0.5">
              <div className="flex justify-between gap-2">
                <span className="flex-1 truncate">{it.name}</span>
                <span className="tabular-nums">
                  {formatCurrency(it.lineTotal)}
                </span>
              </div>
              <div className="flex justify-between pl-2 text-fg-subtle">
                <span>
                  {it.qty} × {formatCurrency(it.unitPrice)}
                </span>
                <span className="font-sans">{it.sku}</span>
              </div>
            </div>
          ))}
        </div>
        <hr className="my-2 border-dashed border-border" />
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span className="text-fg-muted">Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(sale.subtotal)}
            </span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-fg-muted">Discount</span>
              <span className="tabular-nums">
                -{formatCurrency(sale.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium text-espresso-900">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">
              {METHOD_LABELS[sale.paymentMethod]}
            </span>
            <span className="tabular-nums">
              {formatCurrency(sale.amountTendered ?? sale.total)}
            </span>
          </div>
          {sale.paymentMethod === "CASH" && sale.change !== null && sale.change > 0 && (
            <div className="flex justify-between font-medium text-sage-700">
              <span>Change</span>
              <span className="tabular-nums">
                {formatCurrency(sale.change)}
              </span>
            </div>
          )}
        </div>
        <hr className="my-2 border-dashed border-border" />
        <p className="text-center text-fg-subtle">
          Thanks for stopping by! 🦫
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => window.print()}
          className="flex-1"
        >
          <Printer className="size-4" />
          Print
        </Button>
        <Button variant="primary" size="md" onClick={onNewSale} className="flex-1">
          <Plus className="size-4" />
          New sale
        </Button>
      </div>
    </div>
  );
}
