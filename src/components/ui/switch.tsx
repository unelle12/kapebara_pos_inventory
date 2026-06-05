"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

export const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    checked?: boolean;
  }
>(({ className, checked = false, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    checked={checked}
    className={cn(
      "h-4 w-6 shrink-0 rounded-full border border-border bg-surface pointer-events-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-caramel-500",
      className,
    )}
    {...props}
  />
));
Switch.displayName = "Switch";