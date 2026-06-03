import { AlertCircle, AlertTriangle, CheckCircle2, Package } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export type StockStatus = "OUT" | "LOW" | "OK" | "TRACK_OFF";

const STATUS_CONFIG: Record<
  StockStatus,
  {
    label: string;
    variant: "danger" | "clay" | "sage" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  OUT: {
    label: "Out of stock",
    variant: "danger",
    icon: AlertCircle,
  },
  LOW: {
    label: "Low stock",
    variant: "clay",
    icon: AlertTriangle,
  },
  OK: {
    label: "In stock",
    variant: "sage",
    icon: CheckCircle2,
  },
  TRACK_OFF: {
    label: "Not tracked",
    variant: "neutral",
    icon: Package,
  },
};

export function StockBadge({
  status,
  qty,
  className,
}: {
  status: StockStatus;
  qty?: number;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant={cfg.variant}
      size="md"
      className={cn("font-medium", className)}
    >
      <Icon className="size-3" />
      <span>{cfg.label}</span>
      {qty !== undefined && status !== "TRACK_OFF" && (
        <span className="ml-1 font-mono tabular-nums opacity-80">· {qty}</span>
      )}
    </Badge>
  );
}
