import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "~/lib/utils";

type Trend = { value: number; label: string };

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: Trend | null;
  tone?: "default" | "warn" | "sage";
  className?: string;
}) {
  const toneText =
    tone === "warn"
      ? "text-clay-700"
      : tone === "sage"
        ? "text-sage-700"
        : "text-espresso-900";
  const toneBg =
    tone === "warn"
      ? "bg-clay-100 text-clay-700"
      : tone === "sage"
        ? "bg-sage-100 text-sage-700"
        : "bg-caramel-100 text-caramel-700";

  return (
    <div className={cn("card relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            {label}
          </p>
          <p className={cn("mt-2 font-display text-3xl font-medium", toneText)}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn("flex size-9 items-center justify-center rounded-xl", toneBg)}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      {(hint ?? trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && trend.value !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                trend.value > 0
                  ? "bg-sage-100 text-sage-700"
                  : "bg-clay-100 text-clay-700",
              )}
            >
              {trend.value > 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-fg-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
