"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface PasswordFormProps {
  email: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  backHref: string;
}

export function PasswordForm({ email, name, role, backHref }: PasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? (role === "CASHIER" ? "/pos" : "/dashboard");

  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid password");
      return;
    }

    toast.success(`Welcome back, ${name} ☕`);
    router.push(callbackUrl);
    router.refresh();
  }

  const roleLabels: Record<string, string> = {
    OWNER: "Owner",
    MANAGER: "Manager",
    CASHIER: "Cashier",
  };

  return (
    <div className="w-full max-w-sm">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push(backHref)}
        className="mb-6 text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>

      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-caramel-50 px-3 py-1 text-xs font-medium text-caramel-700">
          {roleLabels[role]}
        </div>
        <h2 className="mt-4 font-display text-2xl text-espresso-900">{name}</h2>
        <p className="mt-1 text-sm text-fg-muted">{email}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="text-xs font-medium text-fg-muted">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 pr-11 text-sm",
                "placeholder:text-fg-subtle",
                "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
                error && "border-red-300 focus:border-red-300 focus:ring-red-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-fg-muted hover:bg-cream-100"
              tabIndex={-1}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}