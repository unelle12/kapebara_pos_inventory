"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";

import { supplierFormSchema, type SupplierFormValues, defaultSupplierValues } from "./supplier-form-types";
import { cn } from "~/lib/utils";

export function SupplierForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: SupplierFormValues) => Promise<void>;
  defaultValues?: SupplierFormValues;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema) as never,
    defaultValues: defaultValues ?? defaultSupplierValues(),
  });

  const handleFormSubmit = async (data: SupplierFormValues) => {
    try {
      await onSubmit(data);
      toast.success("Supplier saved");
    } catch (error) {
      toast.error("Failed to save supplier");
      console.error("Failed to save supplier:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g. Capy Coffee Co."
            {...register("name")}
            className={cn(
              "input-error",
              errors.name && "border-destructive"
            )}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contact">Contact Person</Label>
          <Input
            id="contact"
            placeholder="Optional"
            {...register("contact")}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="supplier@example.com"
            {...register("email")}
            className={cn(
              "input-error",
              errors.email && "border-destructive"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register("phone")}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street, City, State, ZIP"
            {...register("address")}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="Special instructions, payment terms, etc."
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="active"
          checked={true}
          {...register("active")}
          className="h-4 w-6"
        />
        <Label htmlFor="active" className="text-sm text-fg">
          Active
        </Label>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Saving…" : "Save Supplier"}
      </Button>
    </form>
  );
}