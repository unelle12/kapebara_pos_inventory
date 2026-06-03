"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ChevronRight, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input, Textarea } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { VariantEditor } from "~/components/products/variant-editor";
import {
  defaultProductValues,
  productFormSchema,
  type ProductFormValues,
} from "~/components/products/product-form-types";
import { api } from "~/trpc/react";
import { cn, formatCurrency } from "~/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { products: number };
};

type Supplier = { id: string; name: string; contact: string | null };

type ExistingProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  cost: number;
  categoryId: string;
  supplierId: string | null;
  trackStock: boolean;
  lowStockThreshold: number;
  active: boolean;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock: number;
    attributes: Record<string, string>;
    sort: number;
    active: boolean;
  }>;
};

export function ProductForm({
  mode,
  categories,
  suppliers,
  initial,
}: {
  mode: "create" | "edit";
  categories: Category[];
  suppliers: Supplier[];
  initial?: ExistingProduct;
}) {
  const router = useRouter();

  const initialValues: ProductFormValues = React.useMemo(() => {
    if (!initial) return defaultProductValues();
    return {
      name: initial.name,
      sku: initial.sku,
      description: initial.description ?? "",
      imageUrl: initial.imageUrl ?? "",
      basePrice: initial.basePrice,
      cost: initial.cost,
      categoryId: initial.categoryId,
      supplierId: initial.supplierId ?? "",
      trackStock: initial.trackStock,
      lowStockThreshold: initial.lowStockThreshold,
      active: initial.active,
      variants: initial.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        cost: v.cost,
        stock: v.stock,
        attributes: v.attributes,
        sort: v.sort,
        active: v.active,
      })),
    };
  }, [initial]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  // Auto-derive SKU from product name on create until user types in the SKU
  // field manually.
  const skuTouched = React.useRef(initial !== undefined);
  const name = watch("name");
  React.useEffect(() => {
    if (mode !== "create" || skuTouched.current) return;
    if (!name) return;
    const derived = name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (derived) setValue("sku", derived, { shouldValidate: false });
  }, [name, mode, setValue]);

  const create = api.product.create.useMutation({
    onSuccess: (p) => {
      toast.success(`Product created`);
      router.push(`/products/${p.id}`);
      router.refresh();
    },
    onError: (e) => toast.error(e.message || "Failed to create product"),
  });

  const update = api.product.update.useMutation({
    onSuccess: (p) => {
      toast.success(`Saved`);
      router.push(`/products/${p.id}`);
      router.refresh();
    },
    onError: (e) => toast.error(e.message || "Failed to save product"),
  });

  function onSubmit(values: ProductFormValues) {
    const payload = {
      ...values,
      description: values.description?.trim() ?? undefined,
      imageUrl: values.imageUrl?.trim() ?? undefined,
      supplierId: values.supplierId ?? undefined,
    };
    if (mode === "create") {
      create.mutate(payload);
    } else if (initial) {
      update.mutate({ id: initial.id, ...payload });
    }
  }

  // Live preview values
  const basePrice = watch("basePrice");
  const cost = watch("cost");
  const liveMargin =
    Number(basePrice) > 0
      ? (((Number(basePrice) - Number(cost)) / Number(basePrice)) * 100).toFixed(1)
      : "—";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={initial ? `/products/${initial.id}` : "/products"}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          {initial ? "Back to product" : "Back to products"}
        </Link>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-clay-700">
              · unsaved changes
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <Send className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* ── Section 1: Basic info ─────────────────────────────── */}
      <section className="card space-y-4 p-6">
        <SectionHeader
          kicker="Section 1 of 3"
          title="Basics"
          hint="What's this product, how customers see it."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Product name" error={errors.name?.message}>
              <Input
                placeholder="Capy's Caramel Latte"
                {...register("name")}
                onChange={(e) => {
                  void register("name").onChange(e);
                  if (mode === "create" && !skuTouched.current) {
                    // re-run the auto-derive
                    setValue(
                      "sku",
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                        .slice(0, 40),
                      { shouldValidate: false },
                    );
                  }
                }}
              />
            </Field>
          </div>

          <Field
            label="SKU"
            hint="Unique across products and variants"
            error={errors.sku?.message}
          >
            <Input
              placeholder="DRK-LATTE-CARAMEL"
              className="font-mono"
              {...register("sku", {
                onChange: () => {
                  skuTouched.current = true;
                },
              })}
            />
          </Field>

          <Field label="Category" error={errors.categoryId?.message}>
            <select
              className={selectCls}
              {...register("categoryId")}
            >
              <option value="">Pick a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c._count.products})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Supplier" hint="Optional">
            <select
              className={selectCls}
              {...register("supplierId")}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Image URL" hint="Optional · https://">
            <Input
              type="url"
              placeholder="https://…"
              {...register("imageUrl")}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description" hint="Optional · up to 2000 chars">
              <Textarea
                rows={3}
                placeholder="A silky, slow-pulled espresso poured over ice with house-made caramel."
                {...register("description")}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* ── Section 2: Pricing ────────────────────────────────── */}
      <section className="card space-y-4 p-6">
        <SectionHeader
          kicker="Section 2 of 3"
          title="Pricing"
          hint="Defaults — variants can override per size/option."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Base price (₱)" error={errors.basePrice?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="font-mono tabular-nums"
              {...register("basePrice", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Cost (₱)" error={errors.cost?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="font-mono tabular-nums"
              {...register("cost", { valueAsNumber: true })}
            />
          </Field>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Live margin
            </span>
            <div className="mt-1 flex h-10 items-center rounded-xl border border-dashed border-border bg-cream-50/40 px-3 text-sm">
              <span
                className={cn(
                  "font-mono tabular-nums",
                  Number(liveMargin) >= 50
                    ? "text-sage-700"
                    : Number(liveMargin) >= 25
                      ? "text-fg"
                      : "text-clay-700",
                )}
              >
                {liveMargin}%
              </span>
              <span className="ml-auto font-mono text-xs text-fg-subtle">
                {formatCurrency(Number(basePrice) || 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Variants ───────────────────────────────── */}
      <section className="card space-y-4 p-6">
        <SectionHeader
          kicker="Section 3 of 3"
          title="Variants"
          hint="Each variant is its own SKU and gets its own stock count."
        />
        <VariantEditor control={control} register={register} />
      </section>

      {/* ── Section 4: Inventory & visibility ─────────────────── */}
      <section className="card space-y-4 p-6">
        <SectionHeader
          kicker="Inventory & visibility"
          title="Stock settings"
          hint="When to alert and whether the product is currently sellable."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Track stock
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 rounded border-border-strong text-caramel-500 focus:ring-caramel-200"
                {...register("trackStock")}
              />
              <span className="text-sm text-fg-muted">
                {watch("trackStock")
                  ? "Counts decremented on each sale"
                  : "Stock is informational only"}
              </span>
            </div>
          </div>
          <Field
            label="Low-stock threshold"
            hint="Trigger an alert at or below this"
            error={errors.lowStockThreshold?.message}
          >
            <Input
              type="number"
              min="0"
              className="font-mono tabular-nums"
              {...register("lowStockThreshold", { valueAsNumber: true })}
            />
          </Field>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
              Visibility
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 rounded border-border-strong text-caramel-500 focus:ring-caramel-200"
                {...register("active")}
              />
              <Badge variant={watch("active") ? "sage" : "neutral"} size="md">
                {watch("active") ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs text-fg-muted">
                Inactive products don&apos;t appear in the POS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom action bar (sticky on mobile) */}
      <div className="card sticky bottom-4 flex items-center justify-between gap-3 p-4 shadow-md">
        <p className="font-mono text-xs text-fg-muted">
          <ChevronRight className="mr-1 inline-block size-3" />
          {Object.keys(errors).length > 0
            ? `${Object.keys(errors).length} field${Object.keys(errors).length === 1 ? "" : "s"} need attention`
            : "All fields look good"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "create" ? (
              <Send className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

const selectCls =
  "mt-1 h-10 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm focus:border-caramel-500 focus:outline-none focus:ring-2 focus:ring-caramel-200";

function SectionHeader({
  kicker,
  title,
  hint,
}: {
  kicker: string;
  title: string;
  hint: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        {kicker}
      </p>
      <h2 className="mt-1 font-display text-2xl text-espresso-900">{title}</h2>
      <p className="text-sm text-fg-muted">{hint}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && (
        <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
