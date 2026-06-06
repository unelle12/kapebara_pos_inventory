import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Hash, Package, Sliders } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { StockBadge, type StockStatus } from "~/components/products/stock-badge";
import { ProductActiveToggle } from "~/components/products/product-active-toggle";
import { ProductLightbox } from "~/components/products/product-lightbox";
import { formatCurrency } from "~/lib/utils";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Product · Kapabara",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("MANAGER");
  const { id } = await params;

  // Validate the id format first so invalid ids 404 instead of 500.
  if (!/^c[a-z0-9]{20,}$/i.test(id)) notFound();

  let product: Awaited<ReturnType<typeof api.product.byId>> = null;
  try {
    product = await api.product.byId({ id });
  } catch {
    notFound();
  }
  if (!product) notFound();

  const totalVariants = product.variants.length;
  const activeVariants = product.variants.filter((v) => v.active).length;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : product.basePrice;
  const maxPrice = prices.length ? Math.max(...prices) : product.basePrice;
  const margins = product.variants
    .map((v) => (v.price > 0 ? ((v.price - v.cost) / v.price) * 100 : 0))
    .filter((m) => Number.isFinite(m));
  const avgMargin = margins.length
    ? margins.reduce((s, m) => s + m, 0) / margins.length
    : 0;

  const status: StockStatus = !product.trackStock
    ? "TRACK_OFF"
    : totalStock === 0
      ? "OUT"
      : product.variants.some((v) => v.stock <= product.lowStockThreshold)
        ? "LOW"
        : "OK";

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-cream-50 text-espresso-700">
              {product.imageUrl ? (
                <ProductLightbox
                  src={product.imageUrl}
                  alt={product.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full rounded-2xl object-contain"
                  />
                </ProductLightbox>
              ) : (
                <Package className="size-9" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl text-espresso-900 sm:text-4xl">
                  {product.name}
                </h1>
                {!product.active && <Badge variant="neutral">Inactive</Badge>}
              </div>
              <p className="mt-1 font-mono text-sm text-fg-subtle">
                {product.sku}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="caramel" size="md">
                  {product.category.name}
                </Badge>
                {product.supplier && (
                  <Badge variant="espresso" size="md">
                    {product.supplier.name}
                  </Badge>
                )}
                {product.trackStock ? (
                  <StockBadge status={status} qty={totalStock} />
                ) : (
                  <StockBadge status="TRACK_OFF" />
                )}
              </div>
              {product.description && (
                <p className="mt-3 max-w-2xl text-sm text-fg-muted">
                  {product.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products">
              <Button variant="outline" size="md">
                <ArrowLeft className="size-4" />
                All products
              </Button>
            </Link>
            <Link href={`/products/${product.id}/edit`}>
              <Button variant="primary" size="md">
                <Edit3 className="size-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Base price"
          value={formatCurrency(product.basePrice)}
          icon={Hash}
        />
        <Stat
          label="Price range"
          value={
            minPrice === maxPrice
              ? formatCurrency(minPrice)
              : `${formatCurrency(minPrice)}–${formatCurrency(maxPrice)}`
          }
          icon={Hash}
        />
        <Stat
          label="Avg margin"
          value={`${avgMargin.toFixed(1)}%`}
          tone={avgMargin >= 50 ? "sage" : avgMargin >= 25 ? "default" : "warn"}
        />
        <Stat
          label="Units sold"
          value={product.unitsSold.toString()}
          icon={Hash}
        />
      </section>

      {/* Variants table */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-cream-50/40 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
              Variants
            </p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {activeVariants} of {totalVariants} active
              {totalVariants > activeVariants && " · archived variants are hidden from POS"}
            </p>
          </div>
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Sliders className="size-3.5" />
              Manage variants
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs">
              <tr className="border-b border-border">
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Name
                </th>
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  SKU
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Price
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Cost
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Margin
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Stock
                </th>
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {product.variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-fg-muted">
                    No variants yet.
                  </td>
                </tr>
              ) : (
                product.variants.map((v) => {
                  const margin =
                    v.price > 0 ? ((v.price - v.cost) / v.price) * 100 : 0;
                  const isLow = v.stock <= product.lowStockThreshold;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-fg">{v.name}</p>
                        {Object.keys(v.attributes as object).length > 0 && (
                          <p className="font-mono text-[11px] text-fg-subtle">
                            {Object.entries(v.attributes as Record<string, string>)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-fg-muted">
                        {v.sku}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg-muted">
                        {formatCurrency(v.cost)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono tabular-nums ${
                          margin >= 50
                            ? "text-sage-700"
                            : margin >= 25
                              ? "text-fg"
                              : "text-clay-700"
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg">
                        {v.stock}
                      </td>
                      <td className="px-5 py-3">
                        {v.active ? (
                          isLow ? (
                            <Badge variant={v.stock === 0 ? "danger" : "clay"} size="sm">
                              {v.stock === 0 ? "Out" : "Low"}
                            </Badge>
                          ) : (
                            <Badge variant="sage" size="sm">In stock</Badge>
                          )
                        ) : (
                          <Badge variant="neutral" size="sm">Inactive</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventory settings + active toggle */}
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            Inventory
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {product.trackStock ? (
              <>
                Alert when any variant drops to{" "}
                <strong className="text-fg">{product.lowStockThreshold}</strong>{" "}
                or below.
              </>
            ) : (
              <>Stock tracking is disabled for this product.</>
            )}
          </p>
        </div>
        <ProductActiveToggle
          productId={product.id}
          initialActive={product.active}
        />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "sage" | "warn";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-fg-subtle" />}
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <p
        className={`mt-2 font-display text-2xl tabular-nums ${
          tone === "sage"
            ? "text-sage-700"
            : tone === "warn"
              ? "text-clay-700"
              : "text-espresso-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
