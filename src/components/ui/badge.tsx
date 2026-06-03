import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-cream-200 text-fg-muted",
        espresso: "bg-espresso-100 text-espresso-800",
        caramel: "bg-caramel-100 text-caramel-800",
        sage: "bg-sage-100 text-sage-700",
        clay: "bg-clay-100 text-clay-700",
        danger: "bg-red-100 text-red-700",
        outline: "border border-border bg-transparent text-fg-muted",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}
