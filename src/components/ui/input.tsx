"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
      "placeholder:text-fg-subtle",
      "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
      "placeholder:text-fg-subtle",
      "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
