"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
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
      setError("Invalid email or password");
      return;
    }
    toast.success("Welcome back ☕");
    router.push(callbackUrl);
    router.refresh();
  }

  function quickFill(email: string) {
    setEmail(email);
    setPassword("password123");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="text-xs font-medium text-fg-muted"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@kapabara.test"
          className={cn(
            "mt-1.5 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
            "placeholder:text-fg-subtle",
            "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
          )}
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="text-xs font-medium text-fg-muted"
        >
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
            )}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-fg-muted hover:bg-cream-100"
            tabIndex={-1}
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Brewing…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-fg-subtle">Quick fill:</span>
        {["owner@kapabara.test", "manager@kapabara.test", "anna@kapabara.test"].map(
          (e) => (
            <button
              key={e}
              type="button"
              onClick={() => quickFill(e)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-fg-muted hover:border-caramel-300 hover:text-espresso-700"
            >
              {e.split("@")[0]}
            </button>
          ),
        )}
      </div>
    </form>
  );
}
