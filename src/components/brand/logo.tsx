import { cn } from "~/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <CapybaraMark size={px} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display font-semibold tracking-tight text-espresso-900",
              size === "sm" && "text-base",
              size === "md" && "text-lg",
              size === "lg" && "text-2xl",
            )}
          >
            kapabara
          </span>
          {size !== "sm" && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle mt-0.5">
              pos · inventory
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function CapybaraMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="capy-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A87148" />
          <stop offset="100%" stopColor="#7A4A2A" />
        </linearGradient>
        <linearGradient id="capy-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6C9A8" />
          <stop offset="100%" stopColor="#C9A37A" />
        </linearGradient>
      </defs>
      {/* coffee bean halo */}
      <circle cx="32" cy="32" r="30" fill="oklch(0.95 0.038 70)" />
      {/* ears */}
      <ellipse cx="20" cy="18" rx="5" ry="6" fill="url(#capy-body)" />
      <ellipse cx="44" cy="18" rx="5" ry="6" fill="url(#capy-body)" />
      <ellipse cx="20" cy="19" rx="2.5" ry="3.5" fill="#5C3520" />
      <ellipse cx="44" cy="19" rx="2.5" ry="3.5" fill="#5C3520" />
      {/* head */}
      <path
        d="M14 30c0-9 8-15 18-15s18 6 18 15v6c0 8-8 14-18 14s-18-6-18-14v-6Z"
        fill="url(#capy-body)"
      />
      {/* snout */}
      <ellipse cx="32" cy="40" rx="9" ry="7" fill="url(#capy-belly)" />
      <ellipse cx="32" cy="39" rx="2.2" ry="1.5" fill="#3B2418" />
      {/* eyes */}
      <circle cx="24" cy="30" r="1.8" fill="#1A1410" />
      <circle cx="40" cy="30" r="1.8" fill="#1A1410" />
      <circle cx="24.5" cy="29.5" r="0.6" fill="#FAF5EC" />
      <circle cx="40.5" cy="29.5" r="0.6" fill="#FAF5EC" />
      {/* cheek blush */}
      <ellipse cx="19" cy="36" rx="2" ry="1.2" fill="#C8843C" opacity="0.55" />
      <ellipse cx="45" cy="36" rx="2" ry="1.2" fill="#C8843C" opacity="0.55" />
    </svg>
  );
}
