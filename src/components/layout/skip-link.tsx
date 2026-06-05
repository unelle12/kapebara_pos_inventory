import { cn } from "~/lib/utils";

export function SkipLink({ className }: { className?: string }) {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:fixed focus:left-4 focus:top-4 focus:z-50",
        "focus:rounded-md focus:bg-espresso-900 focus:px-4 focus:py-2",
        "focus:text-cream-50 focus:shadow-lg focus:outline-none",
        "focus:ring-2 focus:ring-caramel-500 focus:ring-offset-2",
        className,
      )}
    >
      Skip to main content
    </a>
  );
}
