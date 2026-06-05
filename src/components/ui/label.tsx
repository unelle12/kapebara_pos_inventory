"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, htmlFor, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-fg-muted",
      className,
    )}
    htmlFor={htmlFor}
    {...props}
  />
));
Label.displayName = "Label";