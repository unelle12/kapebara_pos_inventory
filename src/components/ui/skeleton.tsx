import * as React from "react";

import { cn } from "~/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shimmer rounded-md bg-cream-100/70 dark:bg-cream-900/40",
        className,
      )}
      {...props}
    />
  );
}

function SkeletonText({
  className,
  width = "w-full",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string }) {
  return (
    <Skeleton
      className={cn("h-3.5", width, className)}
      {...props}
    />
  );
}

function SkeletonRow({
  cols = 4,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading row"
      className={cn(
        "flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-b-0",
        className,
      )}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            i === 0 ? "w-1/3" : i === cols - 1 ? "w-16" : "w-1/5",
          )}
        />
      ))}
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading data"
      className={cn("card overflow-hidden", className)}
    >
      <div className="border-b border-border bg-cream-50/60 px-4 py-3 dark:bg-cream-900/30">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading card"
      className={cn("card space-y-3 p-5", className)}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonKpiStrip({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading metrics"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading metrics…</span>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonRow,
  SkeletonTable,
  SkeletonCard,
  SkeletonKpiStrip,
};
