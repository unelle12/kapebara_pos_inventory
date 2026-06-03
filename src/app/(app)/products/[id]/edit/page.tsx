import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { ProductForm } from "~/components/products/product-form";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Edit product · Kapabara",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("MANAGER");
  const { id } = await params;

  if (!/^c[a-z0-9]{20,}$/i.test(id)) notFound();

  const [product, categories, suppliers] = await Promise.all([
    api.product.byId({ id }).catch(() => null),
    api.product.categories(),
    api.product.suppliers(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase C2 · Editing
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-1 text-fg-muted">
            <code className="font-mono text-xs text-fg-subtle">{product.sku}</code>
            {" · "}
            {product.variants.length}{" "}
            {product.variants.length === 1 ? "variant" : "variants"}
            {" · "}
            {product.unitsSold} units sold
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/products/${product.id}`}>
            <Button variant="outline" size="md">
              <ArrowLeft className="size-4" />
              Back to product
            </Button>
          </Link>
        </div>
      </section>

      <ProductForm
        mode="edit"
        categories={categories}
        suppliers={suppliers}
        initial={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          basePrice: product.basePrice,
          cost: product.cost,
          categoryId: product.category.id,
          supplierId: product.supplier?.id ?? null,
          trackStock: product.trackStock,
          lowStockThreshold: product.lowStockThreshold,
          active: product.active,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            cost: v.cost,
            stock: v.stock,
            attributes: (v.attributes ?? {}) as Record<string, string>,
            sort: v.sort,
            active: v.active,
          })),
        }}
      />
    </div>
  );
}
