"use client";

import { Coffee, Cookie, Croissant, GlassWater, Leaf, Package, Sparkles, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  slug: string;
  productCount: number;
};

const ICON_MAP: Record<string, LucideIcon> = {
  coffee: Coffee,
  cookie: Cookie,
  croissant: Croissant,
  glass: GlassWater,
  leaf: Leaf,
  package: Package,
  sparkles: Sparkles,
  utensils: Utensils,
};

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  caramel: { bg: "bg-caramel-100", text: "text-caramel-700" },
  sage: { bg: "bg-sage-100", text: "text-sage-700" },
  espresso: { bg: "bg-espresso-100", text: "text-espresso-700" },
  rose: { bg: "bg-rose-100", text: "text-rose-700" },
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  amber: { bg: "bg-amber-100", text: "text-amber-700" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
  slate: { bg: "bg-slate-100", text: "text-slate-700" },
};

export function POSCategoryChips({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <Chip
        active={selectedId === null}
        onClick={() => onSelect(null)}
        color="espresso"
        label="All"
        count={categories.reduce((s, c) => s + c.productCount, 0)}
      />
      {categories.map((c) => {
        const Icon = c.icon ? ICON_MAP[c.icon] ?? Package : Package;
        return (
          <Chip
            key={c.id}
            active={selectedId === c.id}
            onClick={() => onSelect(selectedId === c.id ? null : c.id)}
            color={c.color}
            label={c.name}
            count={c.productCount}
            icon={<Icon className="size-3.5" />}
          />
        );
      })}
    </div>
  );
}

function Chip({
  active,
  onClick,
  color,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  color: string | null;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  const palette = COLOR_CLASSES[color ?? "espresso"] ?? COLOR_CLASSES.espresso!;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-espresso-700 bg-espresso-700 text-cream-50 shadow-sm"
          : "border-border bg-surface text-fg-muted hover:border-espresso-300 hover:bg-cream-50",
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-pill px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
          active ? "bg-espresso-600 text-cream-100" : cn(palette.bg, palette.text),
        )}
      >
        {count}
      </span>
    </button>
  );
}
