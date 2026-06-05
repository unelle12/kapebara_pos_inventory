import * as React from "react";
import { type LucideIcon, Inbox, SearchX, AlertTriangle, Coffee } from "lucide-react";

import { cn } from "~/lib/utils";

type EmptyVariant = "default" | "search" | "error" | "first-use";

const variantConfig: Record<
  EmptyVariant,
  { icon: LucideIcon; tint: string; ring: string }
> = {
  default: {
    icon: Inbox,
    tint: "text-fg-muted",
    ring: "ring-border",
  },
  search: {
    icon: SearchX,
    tint: "text-caramel-600",
    ring: "ring-caramel-200/70 dark:ring-caramel-900/50",
  },
  error: {
    icon: AlertTriangle,
    tint: "text-clay-600",
    ring: "ring-clay-200/70 dark:ring-clay-900/50",
  },
  "first-use": {
    icon: Coffee,
    tint: "text-sage-600",
    ring: "ring-sage-200/70 dark:ring-sage-900/50",
  },
};

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon ?? config.icon;
  return (
    <div
      role="status"
      className={cn(
        "card grain flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-cream-50 ring-1",
          config.tint,
          config.ring,
          "dark:bg-cream-900/40",
        )}
        aria-hidden="true"
      >
        <Icon className="size-6" strokeWidth={1.6} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg font-medium text-fg">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-fg-muted text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
