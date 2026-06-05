"use client";

import * as React from "react";

import { EmptyState } from "~/components/ui/empty-state";
import { Button } from "~/components/ui/button";
import { Filter, X } from "lucide-react";

interface TableEmptyStateProps {
  /**
   * If true, treat as a filter result (search/filters active).
   * Renders a "filter" icon and a "Clear filters" CTA when `onClear` is provided.
   */
  filtered?: boolean;
  /** Title for the empty state. */
  title: string;
  /** Optional description. */
  description?: string;
  /** Clear-filters callback (e.g., resets URL params). */
  onClear?: () => void;
  /** Label for the clear CTA. Defaults to "Clear filters". */
  clearLabel?: string;
  /** Optional replacement icon (e.g., ShoppingCart for sales). */
  icon?: React.ComponentProps<typeof EmptyState>["icon"];
  /** Number of columns in the table (for colSpan). */
  colSpan: number;
}

export function TableEmptyState({
  filtered,
  title,
  description,
  onClear,
  clearLabel = "Clear filters",
  icon,
  colSpan,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState
          variant={filtered ? "search" : "default"}
          icon={filtered ? Filter : icon}
          title={title}
          description={
            description ??
            (filtered
              ? "Try a different search term or clear the filters."
              : "There’s nothing to show here yet.")
          }
          action={
            filtered && onClear ? (
              <Button variant="outline" size="sm" onClick={onClear}>
                <X className="size-3.5" />
                {clearLabel}
              </Button>
            ) : null
          }
          className="rounded-none border-0 shadow-none"
        />
      </td>
    </tr>
  );
}
