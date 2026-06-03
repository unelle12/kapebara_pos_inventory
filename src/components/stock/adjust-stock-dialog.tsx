"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MinusCircle, Package, PlusCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type Variant = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  product: {
    id: string;
    name: string;
    lowStockThreshold: number;
    trackStock: boolean;
  };
};

type Mode = "RESTOCK" | "ADJUST";

export function AdjustStockDialog({
  variant,
  onClose,
}: {
  variant: Variant | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("RESTOCK");
  const [amount, setAmount] = React.useState<string>("");
  const [note, setNote] = React.useState("");

  // Reset on open
  React.useEffect(() => {
    if (variant) {
      setMode("RESTOCK");
      setAmount("");
      setNote("");
    }
  }, [variant]);

  const adjust = api.stock.adjust.useMutation({
    onSuccess: (r) => {
      const verb = mode === "RESTOCK" ? "Restocked" : "Adjusted";
      toast.success(`${verb} ${variant?.name} — now ${r.newStock}`);
      onClose();
      router.refresh();
    },
    onError: (e) => toast.error(e.message || "Failed to adjust stock"),
  });

  if (!variant) return null;

  const numAmount = Number(amount) || 0;
  const newStock = variant.stock + (mode === "RESTOCK" ? numAmount : -numAmount);
  const wouldGoNegative = newStock < 0;
  const isValid = numAmount > 0 && !wouldGoNegative;

  function submit() {
    if (!isValid || !variant) return;
    const qtyChange = mode === "RESTOCK" ? numAmount : -numAmount;
    adjust.mutate({
      variantId: variant.id,
      qtyChange,
      type: mode,
      note: note.trim() || undefined,
    });
  }

  return (
    <Dialog open={!!variant} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-caramel-100 text-caramel-700">
              <Package className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Adjust stock</DialogTitle>
              <DialogDescription>
                {variant.product.name} · {variant.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-cream-50/40 p-1">
            <ModeButton
              active={mode === "RESTOCK"}
              onClick={() => setMode("RESTOCK")}
              icon={PlusCircle}
              label="Restock"
              hint="Add to inventory"
              tone="sage"
            />
            <ModeButton
              active={mode === "ADJUST"}
              onClick={() => setMode("ADJUST")}
              icon={MinusCircle}
              label="Adjust"
              hint="Remove or correct"
              tone="clay"
            />
          </div>

          {/* Current stock + new stock preview */}
          <div className="grid grid-cols-3 items-center gap-2 rounded-xl border border-dashed border-border bg-cream-50/40 px-4 py-3 text-sm">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                Current
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-fg">
                {variant.stock}
              </p>
            </div>
            <div className="text-center text-fg-subtle">→</div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                After
              </p>
              <p
                className={cn(
                  "mt-1 font-mono text-2xl font-semibold tabular-nums",
                  wouldGoNegative
                    ? "text-red-700"
                    : newStock <= variant.product.lowStockThreshold
                      ? "text-clay-700"
                      : "text-sage-700",
                )}
              >
                {newStock}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Quantity {mode === "RESTOCK" ? "(units to add)" : "(units to remove)"}
            </label>
            <Input
              type="number"
              min="1"
              max={mode === "ADJUST" ? variant.stock : undefined}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 font-mono tabular-nums"
              autoFocus
            />
            {wouldGoNegative && (
              <p className="mt-1 text-xs text-red-700">
                Cannot reduce below zero — current stock is {variant.stock}.
              </p>
            )}
            {!wouldGoNegative &&
              numAmount > 0 &&
              newStock <= variant.product.lowStockThreshold && (
                <p className="mt-1 text-xs text-clay-700">
                  Heads up: this will leave stock at or below the low-stock threshold of{" "}
                  {variant.product.lowStockThreshold}.
                </p>
              )}
          </div>

          {/* Note */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Note (optional)
            </label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === "RESTOCK"
                  ? "Highland Dairy delivery · PO #1287"
                  : "Spilled during prep · recount after cleanup"
              }
              className="mt-1"
              maxLength={200}
            />
            <p className="mt-1 text-right font-mono text-[10px] text-fg-subtle">
              {note.length}/200
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!isValid || adjust.isPending}
          >
            {adjust.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {mode === "RESTOCK" ? "Add to stock" : "Apply adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  tone: "sage" | "clay";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all",
        active
          ? tone === "sage"
            ? "bg-sage-100 text-sage-800 shadow-sm"
            : "bg-clay-100 text-clay-800 shadow-sm"
          : "text-fg-muted hover:bg-cream-100",
      )}
    >
      <Icon
        className={cn(
          "size-4",
          active ? (tone === "sage" ? "text-sage-700" : "text-clay-700") : "text-fg-subtle",
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-mono text-[10px] text-fg-subtle">{hint}</p>
      </div>
    </button>
  );
}
