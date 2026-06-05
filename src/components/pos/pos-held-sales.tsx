"use client";

import { Hand, X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/utils";
import { useCart, type HeldSale } from "./cart-store";

export function POSHeldSales() {
  const { heldSales, recall, removeHeld } = useCart();
  const [open, setOpen] = useState(false);

  if (heldSales.length === 0) return null;

  return (
    <div className="mt-3 card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-cream-50"
      >
        <div className="flex items-center gap-2">
          <Hand className="size-4 text-caramel-600" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
            Held sales
          </span>
          <span className="rounded-pill bg-caramel-100 px-1.5 py-0.5 font-mono text-[10px] text-caramel-700">
            {heldSales.length}
          </span>
        </div>
        <span className="text-xs text-fg-subtle">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {heldSales.map((h) => (
            <HeldSaleRow
              key={h.id}
              held={h}
              onRecall={() => recall(h)}
              onRemove={() => removeHeld(h.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HeldSaleRow({
  held,
  onRecall,
  onRemove,
}: {
  held: HeldSale;
  onRecall: () => void;
  onRemove: () => void;
}) {
  const total = held.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const age = Math.max(
    1,
    Math.round((Date.now() - held.heldAt) / 60000),
  );

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-espresso-900">
          {held.label}
        </p>
        <p className="font-mono text-[10px] text-fg-subtle">
          {held.lines.length} {held.lines.length === 1 ? "line" : "lines"} ·{" "}
          {formatCurrency(total)} · {age}m ago
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onRecall}>
          Recall
        </Button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Discard"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
