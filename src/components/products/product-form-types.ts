import { z } from "zod";

/**
 * Variant sub-schema. Used both for the form and for the tRPC mutations.
 * `attributes` is stored as a record; the form widget builds it from a
 * "key: value, key2: value2" string the user can paste or type.
 */
export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  sku: z
    .string()
    .trim()
    .min(2, "SKU is required")
    .max(40)
    .regex(/^[A-Z0-9-]+$/i, "Letters, numbers and dashes only")
    .transform((s) => s.toUpperCase()),
  price: z
    .number({ invalid_type_error: "Price is required" })
    .nonnegative("Price must be ≥ 0")
    .max(999999.99),
  cost: z
    .number({ invalid_type_error: "Cost is required" })
    .nonnegative("Cost must be ≥ 0")
    .max(999999.99),
  stock: z
    .number({ invalid_type_error: "Stock is required" })
    .int("Whole numbers only")
    .nonnegative("Stock must be ≥ 0")
    .max(99999),
  attributes: z.record(z.string(), z.string()),
  sort: z.number().int().nonnegative(),
  active: z.boolean(),
});

/**
 * Full product form schema. `z.infer` gives us `ProductFormValues` — the
 * shape after defaults are applied. We use this for the form generic so
 * RHF knows that `variants[i].sort`, `attributes`, etc. are non-optional
 * (even if the *user* never types them — the defaults in
 * `defaultProductValues` fill them in).
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  sku: z
    .string()
    .trim()
    .min(2, "SKU is required")
    .max(40)
    .regex(/^[A-Z0-9-]+$/i, "Letters, numbers and dashes only")
    .transform((s) => s.toUpperCase()),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
  basePrice: z
    .number({ invalid_type_error: "Price is required" })
    .nonnegative("Price must be ≥ 0")
    .max(999999.99),
  cost: z
    .number({ invalid_type_error: "Cost is required" })
    .nonnegative("Cost must be ≥ 0")
    .max(999999.99),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional().or(z.literal("")),
  trackStock: z.boolean(),
  lowStockThreshold: z
    .number()
    .int("Whole numbers only")
    .nonnegative("Threshold must be ≥ 0")
    .max(9999),
  active: z.boolean(),
  variants: z
    .array(variantSchema)
    .min(1, "At least one variant is required")
    .max(50),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Default values for the create form. Pre-fills one empty variant row so
 * the user only has to fill it in.
 */
export function defaultProductValues(): ProductFormValues {
  return {
    name: "",
    sku: "",
    description: "",
    imageUrl: "",
    basePrice: 0,
    cost: 0,
    categoryId: "",
    supplierId: "",
    trackStock: true,
    lowStockThreshold: 5,
    active: true,
    variants: [
      {
        name: "",
        sku: "",
        price: 0,
        cost: 0,
        stock: 0,
        attributes: {},
        sort: 0,
        active: true,
      },
    ],
  };
}
