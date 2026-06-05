"use client";

import { ScanLine, Search } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function POSProductSearch({
  value,
  onChange,
  onScan,
}: {
  value: string;
  onChange: (v: string) => void;
  onScan: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and on `/` shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name or SKU… (press / to focus)"
          className={cn(
            "h-11 w-full rounded-xl border border-border-strong bg-surface pl-10 pr-3 text-sm",
            "placeholder:text-fg-subtle",
            "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
      <Button variant="outline" size="md" onClick={onScan} type="button">
        <ScanLine className="size-4" />
        <span className="hidden sm:inline">Scan</span>
      </Button>
    </div>
  );
}
