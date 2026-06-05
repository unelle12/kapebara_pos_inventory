"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "../../../generated/prisma";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

import {
  userFormSchema,
  userEditFormSchema,
  defaultUserFormValues,
  type UserFormValues,
  type UserEditFormValues,
} from "./user-form-types";

type UserFormProps =
  | {
      mode: "create";
      onSubmit: (data: UserFormValues) => Promise<void>;
      defaultValues?: Partial<UserFormValues>;
    }
  | {
      mode: "edit";
      onSubmit: (data: UserEditFormValues) => Promise<void>;
      defaultValues?: Partial<UserFormValues>;
    };

export function UserForm(props: UserFormProps) {
  const { mode, onSubmit, defaultValues } = props;
  const isCreate = mode === "create";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(isCreate ? userFormSchema : userEditFormSchema) as never,
    defaultValues: { ...defaultUserFormValues(), ...defaultValues },
  });

  const active = watch("active");

  const handleFormSubmit = async (data: UserFormValues) => {
    try {
      if (isCreate) {
        await onSubmit(data);
      } else {
        const { password: _pw, ...rest } = data;
        void _pw;
        await onSubmit(rest);
      }
      toast.success(isCreate ? "User created" : "User updated");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(msg);
      console.error("User form error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="e.g. Anna Barista"
            {...register("name")}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="anna@kapabara.test"
            autoComplete="off"
            {...register("email")}
            className={cn(errors.email && "border-destructive")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {isCreate && (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...register("password")}
              className={cn(errors.password && "border-destructive")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            {...register("role")}
            className={cn(
              "h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm",
              "focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200",
            )}
          >
            <option value={UserRole.CASHIER}>Cashier — POS only</option>
            <option value={UserRole.MANAGER}>Manager — Inventory + reports</option>
            <option value={UserRole.OWNER}>Owner — Full access</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        <div className="flex items-end">
          <div className="flex items-center gap-3">
            <Switch
              id="active"
              checked={active}
              onChange={(e) =>
                setValue("active", e.target.checked, { shouldDirty: true })
              }
              className="h-4 w-6"
            />
            <Label htmlFor="active" className="text-sm text-fg">
              Active
            </Label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting
          ? isCreate
            ? "Creating…"
            : "Saving…"
          : isCreate
            ? "Create user"
            : "Save changes"}
      </Button>
    </form>
  );
}
