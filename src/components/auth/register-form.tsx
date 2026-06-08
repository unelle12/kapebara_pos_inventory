"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff, Loader2, ArrowLeft, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface RegisterFormProps {
  role: "MANAGER" | "CASHIER";
  backHref: string;
}

const ROLE_CONFIG = {
  MANAGER: { icon: Shield, label: "Manager", color: "sage" },
  CASHIER: { icon: Users, label: "Cashier", color: "espresso" },
} as const;

export function RegisterForm({ role, backHref }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? (role === "CASHIER" ? "/pos" : "/dashboard");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const registerMutation = api.auth.registerUser.useMutation({
    onSuccess: async (user) => {
      setLoading(true);
      const res = await signIn("credentials", {
        email: user.email,
        password: password,
        redirect: false,
      });
      setLoading(false);
      if (!res || res.error) {
        setError("Account created but auto sign-in failed. Please sign in manually.");
        return;
      }
      toast.success(`Welcome to the team, ${user.name}! ☕`);
      router.push(callbackUrl);
      router.refresh();
    },
    onError: (err) => {
      setLoading(false);
      if (err.data?.code === "CONFLICT") {
        setError("This email is already registered");
      } else {
        setError(err.message ?? "Registration failed. Please try again.");
      }
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    registerMutation.mutate({ name, email, password, role });
  }

  const { label } = ROLE_CONFIG[role];

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
          Register as {label}
        </div>
        <h2 className="mt-4 font-display text-2xl text-espresso-900">Create your account</h2>
        <p className="mt-1 text-sm text-fg-muted">Fill in your details to get started</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-xs font-medium text-fg-muted">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className={cn(
              "mt-1.5 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
              "placeholder:text-fg-subtle",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
              error && "border-red-300 focus:border-red-300 focus:ring-red-200"
            )}
          />
        </div>

        <div>
          <label htmlFor="email" className="text-xs font-medium text-fg-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@kapabara.test"
            className={cn(
              "mt-1.5 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
              "placeholder:text-fg-subtle",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
              error && "border-red-300 focus:border-red-300 focus:ring-red-200"
            )}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-medium text-fg-muted">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
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

        <div>
          <label htmlFor="confirmPassword" className="text-xs font-medium text-fg-muted">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={cn(
              "mt-1.5 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm",
              "placeholder:text-fg-subtle",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
              error && "border-red-300 focus:border-red-300 focus:ring-red-200"
            )}
          />
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-fg-muted">
        By creating an account, you agree to our terms of service.
      </p>
    </div>
  );
}