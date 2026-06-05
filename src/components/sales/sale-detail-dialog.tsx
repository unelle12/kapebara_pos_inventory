"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  History,
  Loader2,
  Printer,
  Receipt,
  RotateCcw,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function SaleDetailDialog({
  saleId,
  onClose,
}: {
  saleId: string | null;
  onClose: () => void;
}) {
  const [refundMode, setRefundMode] = React.useState(false);

  const query = api.sale.byId.useQuery(
    { id: saleId ?? "" },
    { enabled: saleId !== null, refetchOnWindowFocus: false },
  );

  const utils = api.useUtils();
  const refund = api.sale.refund.useMutation({
    onSuccess: (res) => {
      toast.success(
        res.returnedItems
          ? `Refunded ${formatPHP(res.refund.amount)} — stock returned`
          : `Recorded ${formatPHP(res.refund.amount)} refund`,
      );
      setRefundMode(false);
      void utils.sale.byId.invalidate({ id: saleId ?? "" });
      void utils.sale.list.invalidate();
      void utils.dashboard.kpis.invalidate();
      void utils.stock.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Close on Escape.
  React.useEffect(() => {
    if (!saleId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (refundMode) setRefundMode(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saleId, refundMode, onClose]);

  if (!saleId) return null;

  const sale = query.data;
  const isLoading = query.isLoading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
              {refundMode ? "Issue refund" : "Sale detail"}
            </p>
            <h2 className="mt-1 truncate font-display text-2xl font-medium text-espresso-900">
              {sale?.reference ?? "…"}
            </h2>
            {sale && (
              <p className="mt-0.5 font-mono text-[11px] text-fg-subtle">
                {formatDate(sale.createdAt)} · {formatTime(sale.createdAt)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-cream-100 hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !sale ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-fg-muted">
              <Loader2 className="size-4 animate-spin" />
              Loading sale…
            </div>
          ) : refundMode ? (
            <RefundForm
              sale={sale}
              isPending={refund.isPending}
              onCancel={() => setRefundMode(false)}
              onSubmit={(reason, amount, returnItems) =>
                refund.mutate({ id: sale.id, reason, amount, returnItems })
              }
            />
          ) : (
            <SaleDetail sale={sale} />
          )}
        </div>

        {/* Footer */}
        {sale && !refundMode && (
          <div className="flex flex-col gap-2 border-t border-border bg-cream-50/40 px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" />
              Print receipt
            </Button>
            {sale.status === "COMPLETED" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRefundMode(true)}
                className="bg-clay-600 hover:bg-clay-700"
              >
                <RotateCcw className="size-3.5" />
                Issue refund
              </Button>
            ) : (
              <span className="rounded-full bg-clay-100 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-clay-700">
                {sale.status}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type SaleDetailData = {
  id: string;
  reference: string;
  status: "COMPLETED" | "REFUNDED" | "VOID";
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: "CASH" | "CARD" | "EWALLET";
  amountTendered: number | null;
  change: number | null;
  note: string | null;
  createdAt: Date;
  cashier: { id: string; name: string; email: string; role: string };
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
    unitCost: number;
    lineTotal: number;
  }>;
  refunds: Array<{
    id: string;
    reason: string;
    amount: number;
    createdAt: Date;
    user: { id: string; name: string };
  }>;
};

function SaleDetail({ sale }: { sale: SaleDetailData }) {
  return (
    <div className="space-y-5">
      {/* Meta */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta icon={User} label="Cashier">
          <p className="truncate text-sm font-medium text-fg">{sale.cashier.name}</p>
          <p className="truncate font-mono text-[10px] text-fg-subtle">
            {sale.cashier.role.toLowerCase()}
          </p>
        </Meta>
        <Meta icon={paymentIcon(sale.paymentMethod)} label="Method">
          <p className="text-sm font-medium text-fg">{paymentLabel(sale.paymentMethod)}</p>
          {sale.paymentMethod === "CASH" && sale.amountTendered !== null && (
            <p className="font-mono text-[10px] text-fg-subtle">
              Tendered {formatPHP(sale.amountTendered)} · Change {formatPHP(sale.change ?? 0)}
            </p>
          )}
        </Meta>
        <Meta icon={Receipt} label="Total">
          <p className="font-mono text-base font-semibold tabular-nums text-fg">
            {formatPHP(sale.total)}
          </p>
          {sale.discount > 0 && (
            <p className="font-mono text-[10px] text-clay-700">
              −{formatPHP(sale.discount)} disc
            </p>
          )}
        </Meta>
        <Meta icon={History} label="Status">
          <StatusPill status={sale.status} />
          {sale.note && (
            <p className="mt-1 truncate font-mono text-[10px] italic text-fg-subtle" title={sale.note}>
              &ldquo;{sale.note}&rdquo;
            </p>
          )}
        </Meta>
      </section>

      {/* Items */}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
          Items ({sale.items.length})
        </h3>
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream-50/60 text-left">
              <tr>
                <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Item
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Qty
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Unit
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Line
                </th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((i) => (
                <tr key={i.id} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <p className="text-fg">{i.name}</p>
                    <p className="font-mono text-[10px] text-fg-subtle">{i.sku}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-fg-muted">
                    ×{i.qty}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-fg-muted">
                    {formatPHP(i.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums font-medium text-fg">
                    {formatPHP(i.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-cream-50/40">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-fg-muted">
                  Subtotal
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-fg-muted">
                  {formatPHP(sale.subtotal)}
                </td>
              </tr>
              {sale.discount > 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right text-xs text-fg-muted">
                    Discount
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-clay-700">
                    −{formatPHP(sale.discount)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-fg">
                  Total
                </td>
                <td className="px-3 py-2 text-right font-mono text-base font-semibold tabular-nums text-fg">
                  {formatPHP(sale.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Existing refunds */}
      {sale.refunds.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
            Refunds ({sale.refunds.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {sale.refunds.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-xl border border-clay-200 bg-clay-50/40 p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-clay-100 text-clay-700">
                  <RotateCcw className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{r.reason}</p>
                  <p className="font-mono text-[10px] text-fg-subtle">
                    {formatDate(r.createdAt)} · {formatTime(r.createdAt)} · {r.user.name}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold tabular-nums text-clay-700">
                  −{formatPHP(r.amount)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RefundForm({
  sale,
  isPending,
  onCancel,
  onSubmit,
}: {
  sale: SaleDetailData;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (reason: string, amount: number, returnItems: boolean) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [amountStr, setAmountStr] = React.useState(sale.total.toFixed(2));
  const [returnItems, setReturnItems] = React.useState(true);

  const amount = Number(amountStr);
  const isFull = Math.abs(amount - sale.total) < 0.005;
  const valid =
    reason.trim().length >= 2 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= sale.total;

  const presets = [
    "Customer changed mind",
    "Wrong order",
    "Quality issue",
    "Damaged item",
  ];

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit(reason.trim(), amount, isFull && returnItems);
      }}
    >
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-clay-200 bg-clay-50/60 p-3">
        <AlertTriangle className="size-4 shrink-0 text-clay-700" />
        <div className="text-xs text-fg-muted">
          <p className="font-medium text-fg">This action is logged</p>
          <p className="mt-0.5">
            Refunds are permanent. {isFull && returnItems
              ? "Stock will be returned to inventory for all line items."
              : "Stock will not be returned (partial or items kept)."}
          </p>
        </div>
      </div>

      {/* Reason */}
      <section>
        <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
          Reason
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setReason(p)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                reason === p
                  ? "border-caramel-500 bg-caramel-100 text-espresso-900"
                  : "border-border bg-cream-50/40 text-fg-muted hover:bg-cream-100",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer found drink too cold"
          maxLength={200}
          className="mt-2 h-9 w-full rounded-lg border border-border bg-cream-50/60 px-3 text-sm text-fg placeholder:text-fg-subtle focus:border-caramel-500 focus:outline-none"
          autoFocus
        />
        <p className="mt-1 font-mono text-[10px] text-fg-subtle">
          {reason.length}/200
        </p>
      </section>

      {/* Amount */}
      <section>
        <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
          Refund amount
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-base text-fg-subtle">₱</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={sale.total}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-cream-50/60 px-3 font-mono text-sm tabular-nums text-fg focus:border-caramel-500 focus:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmountStr(sale.total.toFixed(2))}
          >
            Full
          </Button>
        </div>
        <p className="mt-1 font-mono text-[10px] text-fg-subtle">
          Original sale: {formatPHP(sale.total)} ·{" "}
          {isFull ? "Full refund" : `Partial: ${((amount / sale.total) * 100).toFixed(0)}%`}
        </p>
      </section>

      {/* Stock return toggle (only for full refund) */}
      {isFull && (
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-cream-50/40 p-3">
          <input
            type="checkbox"
            checked={returnItems}
            onChange={(e) => setReturnItems(e.target.checked)}
            className="mt-0.5 size-4 accent-caramel-500"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">Return items to stock</p>
            <p className="font-mono text-[10px] text-fg-subtle">
              Restores stock for {sale.items.length} line
              {sale.items.length === 1 ? "" : "s"} and logs REFUND stock movements.
            </p>
          </div>
        </label>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!valid || isPending}
          className="bg-clay-600 hover:bg-clay-700"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" />
              Refund {formatPHP(amount)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-cream-50/40 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3 text-fg-subtle" />
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "COMPLETED" | "REFUNDED" | "VOID" }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-700">
        <span className="size-1.5 rounded-full bg-sage-500" />
        Completed
      </span>
    );
  }
  if (status === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-clay-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-clay-700">
        <RotateCcw className="size-2.5" />
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
      Void
    </span>
  );
}

function paymentIcon(m: "CASH" | "CARD" | "EWALLET") {
  return m === "CASH" ? Wallet : CreditCard;
}

function paymentLabel(m: "CASH" | "CARD" | "EWALLET") {
  return m === "CASH" ? "Cash" : m === "CARD" ? "Card" : "E-Wallet";
}

function formatPHP(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
