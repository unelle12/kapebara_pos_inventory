import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Mail, MapPin, Package, Phone, Users } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import { cn } from "~/lib/utils";

export const metadata = {
  title: "Supplier · Kapabara",
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("MANAGER");
  const { id } = await params;

  // Validate the id format first so invalid ids 404 instead of 500.
  if (!/^c[a-z0-9]{20,}$/i.test(id)) notFound();

  let sup: Awaited<ReturnType<typeof api.supplier.byId>> | null = null;
  try {
    sup = await api.supplier.byId({ id });
  } catch {
    notFound();
  }
  if (!sup) notFound();
  const supplier = sup;

  const activeProducts = supplier.products.filter((p) => p.active);
  const inactiveProducts = supplier.products.filter((p) => !p.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-espresso-700">
              <Users className="size-9" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl text-espresso-900 sm:text-4xl">
                  {supplier.name}
                </h1>
                {!supplier.active && <Badge variant="neutral">Inactive</Badge>}
              </div>
              <p className="mt-1 font-mono text-sm text-fg-subtle">
                {supplier.contact ?? "No contact person"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {supplier.email && (
                  <>
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-1 text-fg-hover underline-offset-2 hover:underline"
                    >
                      <Mail className="size-3.5" />
                      {supplier.email}
                    </a>
                  </>
                )}
                {supplier.phone && (
                  <span className="mx-2">
                    <Phone className="size-3.5" />
                    {supplier.phone}
                  </span>
                )}
                {supplier.address && (
                  <span className="ml-2">
                    <MapPin className="size-3.5" />
                    {supplier.address}
                  </span>
                )}
              </div>
              {supplier.notes && (
                <p className="mt-3 max-w-2xl text-sm text-fg-muted">
                  {supplier.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/suppliers">
              <Button variant="outline" size="md">
                <ArrowLeft className="size-4" />
                All suppliers
              </Button>
            </Link>
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Button variant="primary" size="md">
                <Edit3 className="size-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Active products"
          value={activeProducts.length.toString()}
          icon={Package}
        />
        <Stat
          label="Total products"
          value={supplier.products.length.toString()}
          icon={Package}
        />
        <Stat
          label="Member since"
          value={new Date(supplier.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          icon={Users}
        />
        <Stat
          label="Last updated"
          value={new Date(supplier.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          icon={Users}
        />
      </section>

      {/* Products from this supplier */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-cream-50/40 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
              Products
            </p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {activeProducts.length} active · {inactiveProducts.length} inactive
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs">
              <tr className="border-b border-border">
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Product
                </th>
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  SKU
                </th>
                <th className="px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Category
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  Price
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
              {supplier.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-fg-muted">
                    No products yet linked to this supplier.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Active products */}
                  {activeProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-fg">{p.name}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-fg-muted">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            p.category.color ? `bg-${p.category.color}-500` : "bg-fg-subtle"
                          )}
                        />
                        {p.category.name}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg">
                        {p.basePrice !== null ? `₱${p.basePrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg">
                        {p.variants.reduce((sum, v) => sum + v.stock, 0)}
                        {p.variants.reduce((sum, v) => sum + v.stock, 0)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={p.active ? "sage" : "neutral"}
                          size="sm"
                        >
                          {p.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {/* Inactive products (dimmed) */}
                  {inactiveProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/60 opacity-50"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-fg-muted">{p.name}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-fg-muted">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            p.category.color ? `bg-${p.category.color}-500` : "bg-fg-subtle"
                          )}
                        />
                        {p.category.name}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg-muted">
                        {p.basePrice !== null ? `₱${p.basePrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-fg-muted">
                        {p.variants.reduce((sum, v) => sum + v.stock, 0)}
                        {p.variants.reduce((sum, v) => sum + v.stock, 0)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="neutral" size="sm">
                          Inactive
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-fg-subtle" />}
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {label}
        </p>
      </div>
      <p className="mt-2 font-display text-2xl tabular-nums text-espresso-900">
        {value}
      </p>
    </div>
  );
}
