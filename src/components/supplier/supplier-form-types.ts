import { z } from "zod";

/**
 * Supplier form schema for create/edit operations.
 */
export const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  contact: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

/**
 * Default values for the supplier form.
 */
export function defaultSupplierValues(): SupplierFormValues {
  return {
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    active: true,
  };
}