"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-espresso-800 text-cream-50 shadow-sm hover:bg-espresso-900 hover:shadow-md",
        accent:
          "bg-caramel-500 text-espresso-950 shadow-sm hover:bg-caramel-600 hover:shadow-md",
        secondary:
          "bg-cream-100 text-espresso-900 border border-border hover:bg-cream-200 hover:border-border-strong",
        outline:
          "bg-transparent text-fg border border-border-strong hover:bg-cream-100",
        ghost: "bg-transparent text-fg hover:bg-cream-100",
        soft: "bg-caramel-100 text-caramel-800 hover:bg-caramel-200",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-10 px-4 text-sm rounded-xl",
        lg: "h-12 px-6 text-base rounded-xl",
        xl: "h-14 px-8 text-lg rounded-2xl",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
