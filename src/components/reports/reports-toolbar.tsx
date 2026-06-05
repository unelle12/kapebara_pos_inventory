"use client";

import { Calendar } from "lucide-react";

import { cn } from "~/lib/utils";

const RANGES: { value: "7d" | "30d" | "90d" | "all"; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

export function ReportsToolbar({
  value,
  onChange,
}: {
  value: "7d" | "30d" | "90d" | "all";
  onChange: (next: "7d" | "30d" | "90d" | "all") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-cream-50/40 p-0.5">
      <Calendar className="ml-1.5 size-3.5 text-fg-subtle" />
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "h-8 rounded-lg px-3 font-mono text-[11px] uppercase tracking-wider transition-colors",
            value === r.value
              ? "bg-espresso-700 text-cream-50"
              : "text-fg-muted hover:bg-cream-100 hover:text-fg",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
