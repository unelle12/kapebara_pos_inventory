"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  History,
  ShoppingBag,
  Wrench,
  Undo2,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type Movement = {
  id: string;
  type: "SALE" | "RESTOCK" | "ADJUST" | "REFUND";
  qty: number;
  note: string | null;
  createdAt: Date;
  userName: string;
  userRole: string;
  product: { id: string; name: string; sku: string } | null;
  variant: { id: string; name: string; sku: string } | null;
};

const TYPE_CONFIG: Record<
  Movement["type"],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "sage" | "clay" | "espresso" | "danger" | "neutral";
  }
> = {
  SALE: { label: "Sale", icon: ShoppingBag, variant: "espresso" },
  RESTOCK: { label: "Restock", icon: ArrowUp, variant: "sage" },
  ADJUST: { label: "Adjust", icon: Wrench, variant: "clay" },
  REFUND: { label: "Refund", icon: Undo2, variant: "danger" },
};

export function RecentMovements({ movements }: { movements: Movement[] }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            Activity
          </p>
          <p className="mt-0.5 font-display text-lg text-espresso-900">
            Recent movements
          </p>
        </div>
        <History className="size-4 text-fg-subtle" />
      </div>

      {movements.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-cream-50/40 px-4 py-8 text-center">
          <Clock className="size-5 text-fg-subtle" />
          <p className="text-sm text-fg-muted">No movements yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {movements.slice(0, 12).map((m) => {
            const cfg = TYPE_CONFIG[m.type];
            const Icon = cfg.icon;
            return (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-3"
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    cfg.variant === "sage" && "bg-sage-100 text-sage-700",
                    cfg.variant === "clay" && "bg-clay-100 text-clay-700",
                    cfg.variant === "espresso" && "bg-espresso-100 text-espresso-700",
                    cfg.variant === "danger" && "bg-red-100 text-red-700",
                    cfg.variant === "neutral" && "bg-cream-200 text-fg-muted",
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={cfg.variant} size="sm">
                      {cfg.label}
                    </Badge>
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold tabular-nums",
                        m.qty > 0 ? "text-sage-700" : "text-clay-700",
                      )}
                    >
                      {m.qty > 0 ? "+" : ""}
                      {m.qty}
                    </span>
                    <ArrowDown className="size-2.5 text-fg-subtle" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg">
                    {m.product?.name ?? "Unknown product"}
                    {m.variant && m.variant.name !== m.product?.name && (
                      <span className="text-fg-muted"> · {m.variant.name}</span>
                    )}
                  </p>
                  {m.note && (
                    <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                      {m.note}
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] text-fg-subtle">
                    {timeAgo(m.createdAt)} · {m.userName}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function timeAgo(d: Date) {
  const ms = Date.now() - new Date(d).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(d).toLocaleDateString();
}
