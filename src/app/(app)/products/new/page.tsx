import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { requireRole } from "~/lib/auth-helpers";
import { ProductForm } from "~/components/products/product-form";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Add product · Kapabara",
};

export default async function NewProductPage() {
  await requireRole("MANAGER");

  const [categories, suppliers] = await Promise.all([
    api.product.categories(),
    api.product.suppliers(),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase C2 · Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Add a product
          </h1>
          <p className="mt-1 text-fg-muted">
            Build the catalog one item at a time. You can edit anything later.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products">
            <Button variant="outline" size="md">
              <ArrowLeft className="size-4" />
              Back to list
            </Button>
          </Link>
        </div>
      </section>

      <ProductForm
        mode="create"
        categories={categories}
        suppliers={suppliers}
      />

      {/* Quick tips */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-cream-50/40 p-4 text-sm text-fg-muted">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
          <Plus className="size-4" />
        </div>
        <div>
          <p className="font-medium text-fg">Tips for a great catalog</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
            <li>SKU stays unique across products and variants — keep it short.</li>
            <li>Start with one variant, then add sizes, temps, or colors as needed.</li>
            <li>Set a low-stock threshold (default 5) so you get notified before it runs out.</li>
            <li>Leave the supplier blank for now — you can link it from the supplier&apos;s page in C4.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
