import { z } from "zod";
import { UserRole } from "../../../generated/prisma";

/**
 * User form schema for create/edit operations.
 *
 * Create: requires password (min 8).
 * Edit: password is NOT touched here; use the dedicated reset-password flow.
 */
export const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(100),
  role: z.nativeEnum(UserRole).default(UserRole.CASHIER),
  active: z.boolean().default(true),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .optional()
    .or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

/**
 * Edit-form variant (no password field).
 */
export const userEditFormSchema = userFormSchema.omit({ password: true });
export type UserEditFormValues = z.infer<typeof userEditFormSchema>;

/**
 * Reset-password schema (used by the dedicated action).
 */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * Default values for the create form.
 */
export function defaultUserFormValues(): UserFormValues {
  return {
    name: "",
    email: "",
    role: UserRole.CASHIER,
    active: true,
    password: "",
  };
}
