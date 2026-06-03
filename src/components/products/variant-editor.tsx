"use client";

import * as React from "react";
import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn, formatCurrency } from "~/lib/utils";
import type { ProductFormValues } from "~/components/products/product-form-types";

type VariantRowProps = {
  index: number;
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  remove: (index: number) => void;
};

export function VariantRow({
  index,
  control,
  register,
  remove,
}: VariantRowProps) {
  const v = (control as unknown as { _formState?: { errors?: { variants?: Array<{ name?: { message?: string }; sku?: { message?: string } }> } } })
    ._formState?.errors?.variants?.[index];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Name */}
        <div className="md:col-span-4">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Variant name
          </label>
          <Input
            placeholder="e.g. Medium · Iced"
            className="mt-1"
            {...register(`variants.${index}.name` as const)}
          />
          {v?.name && (
            <p className="mt-1 text-xs text-red-700">{v.name.message}</p>
          )}
        </div>

        {/* SKU */}
        <div className="md:col-span-3">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            SKU
          </label>
          <Input
            placeholder="DRK-CAP-12I"
            className="mt-1 font-mono"
            {...register(`variants.${index}.sku` as const)}
          />
          {v?.sku && (
            <p className="mt-1 text-xs text-red-700">{v.sku.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="md:col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Price (₱)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="mt-1 font-mono tabular-nums"
            {...register(`variants.${index}.price` as const, {
              valueAsNumber: true,
            })}
          />
        </div>

        {/* Cost */}
        <div className="md:col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Cost (₱)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="mt-1 font-mono tabular-nums"
            {...register(`variants.${index}.cost` as const, {
              valueAsNumber: true,
            })}
          />
        </div>

        {/* Remove */}
        <div className="flex items-end justify-end md:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(index)}
            aria-label="Remove variant"
            title="Remove variant"
          >
            <Trash2 className="size-4 text-red-700" />
          </Button>
        </div>

        {/* Stock + attributes + active */}
        <div className="md:col-span-3">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Stock
          </label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            className="mt-1 font-mono tabular-nums"
            {...register(`variants.${index}.stock` as const, {
              valueAsNumber: true,
            })}
          />
        </div>

        <div className="md:col-span-6">
          <label className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Attributes (e.g. size: 12oz, temp: iced)
          </label>
          <AttributeChips
            control={control}
            index={index}
            register={register}
          />
        </div>

        <div className="flex items-end justify-end gap-2 md:col-span-3">
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input
              type="checkbox"
              className="size-4 rounded border-border-strong text-caramel-500 focus:ring-caramel-200"
              {...register(`variants.${index}.active` as const)}
            />
            Active
          </label>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AttributeChips({
  control,
  index,
  register,
}: {
  control: Control<ProductFormValues>;
  index: number;
  register: UseFormRegister<ProductFormValues>;
}) {
  // We can't useFieldArray on a record-typed field with rhf, so we use a
  // hidden JSON input synced with a simple comma-separated string. The
  // string is parsed on submit (see product-form schema).
  const [raw, setRaw] = React.useState("");

  // Load the initial value from the form on mount.
  const initial = React.useRef<string | null>(null);
  if (initial.current === null) {
    const formValues = control._formValues as { variants?: Array<{ attributes?: Record<string, string> }> };
    const v = formValues.variants?.[index]?.attributes;
    if (v && typeof v === "object") {
      const s = Object.entries(v)
        .map(([k, val]) => `${k}: ${val}`)
        .join(", ");
      initial.current = s;
      if (raw === "") setRaw(s);
    } else {
      initial.current = "";
    }
  }

  return (
    <>
      <Input
        placeholder="size: 12oz, temp: iced"
        className="mt-1"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          // Update the underlying record via a hidden input that the form
          // schema will parse.
          const obj: Record<string, string> = {};
          e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((pair) => {
              const [k, ...rest] = pair.split(":");
              if (k && rest.length) {
                obj[k.trim()] = rest.join(":").trim();
              }
            });
          // Direct write into RHF state for this nested field.
          const variants = (control._formValues as { variants?: Array<{ attributes?: Record<string, string> }> }).variants;
          if (variants?.[index]) {
            variants[index].attributes = obj;
          }
        }}
      />
      <input
        type="hidden"
        {...register(`variants.${index}.attributes` as const)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

export function VariantEditor({
  control,
  register,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Compute live totals from the current form values
  const formValues = (control._formValues as { variants?: ProductFormValues["variants"] });
  const variantValues = formValues.variants ?? [];
  const totalStock = variantValues.reduce(
    (s: number, v) => s + (Number(v.stock) || 0),
    0,
  );
  const margins = variantValues
    .map((v) => {
      const price = Number(v.price) || 0;
      const cost = Number(v.cost) || 0;
      return price > 0 ? ((price - cost) / price) * 100 : 0;
    })
    .filter((m) => Number.isFinite(m));
  const avgMargin = margins.length
    ? margins.reduce((s: number, m) => s + m, 0) / margins.length
    : 0;
  const priceRange = (() => {
    const prices = variantValues
      .map((v) => Number(v.price) || 0)
      .filter((p) => p > 0);
    if (!prices.length) return "—";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatCurrency(min) : `${formatCurrency(min)}–${formatCurrency(max)}`;
  })();

  return (
    <div className="space-y-3">
      {/* Live summary */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-dashed border-border bg-cream-50/40 px-4 py-2.5 text-xs text-fg-muted">
        <span>
          <span className="font-mono uppercase tracking-wider text-fg-subtle">count</span>{" "}
          <span className="text-fg font-medium">{fields.length}</span>
        </span>
        <span>
          <span className="font-mono uppercase tracking-wider text-fg-subtle">total stock</span>{" "}
          <span className="font-mono tabular-nums text-fg">{totalStock}</span>
        </span>
        <span>
          <span className="font-mono uppercase tracking-wider text-fg-subtle">price range</span>{" "}
          <span className="font-mono tabular-nums text-fg">{priceRange}</span>
        </span>
        <span>
          <span className="font-mono uppercase tracking-wider text-fg-subtle">avg margin</span>{" "}
          <span
            className={cn(
              "font-mono tabular-nums",
              avgMargin >= 50
                ? "text-sage-700"
                : avgMargin >= 25
                  ? "text-fg"
                  : "text-clay-700",
            )}
          >
            {avgMargin.toFixed(1)}%
          </span>
        </span>
      </div>

      {/* Rows */}
      {fields.map((field, idx) => (
        <VariantRow
          key={field.id}
          index={idx}
          control={control}
          register={register}
          remove={remove}
        />
      ))}

      {/* Empty state when no rows yet */}
      {fields.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-cream-50/40 p-6 text-center text-sm text-fg-muted">
          No variants yet — add at least one to make this product sellable.
        </div>
      )}

      {/* Add */}
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() =>
          append({
            name: "",
            sku: "",
            price: 0,
            cost: 0,
            stock: 0,
            attributes: {},
            sort: fields.length,
            active: true,
          })
        }
        className="w-full sm:w-auto"
      >
        <Plus className="size-4" />
        Add variant
      </Button>
    </div>
  );
}
