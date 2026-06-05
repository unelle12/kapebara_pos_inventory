"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

import { resetPasswordSchema, type ResetPasswordValues } from "./user-form-types";

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema) as never,
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const resetMutation = api.user.resetPassword.useMutation({
    onSuccess: () => {
      toast.success(`Password reset for ${userName}`);
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function onSubmit(data: ResetPasswordValues) {
    resetMutation.mutate({ id: userId, newPassword: data.newPassword });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <span className="inline-flex items-center gap-2">
              <KeyRound className="size-4 text-caramel-600" />
              Reset password
            </span>
          </DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{userName}</strong>. The change takes
            effect immediately — they will need to sign in with the new password
            on their next session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...register("newPassword")}
              className={cn(errors.newPassword && "border-destructive")}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={cn(errors.confirmPassword && "border-destructive")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || resetMutation.isPending}
            className="w-full"
          >
            {isSubmitting || resetMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Resetting…
              </>
            ) : (
              <>
                <KeyRound className="size-4" />
                Reset password
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Helper hook for the parent — keeps the open state local. */
export function useResetPassword() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
