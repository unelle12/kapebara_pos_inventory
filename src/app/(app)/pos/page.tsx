import { ShoppingCart } from "lucide-react";

import { requireRole } from "~/lib/auth-helpers";
import { api } from "~/trpc/server";
import { CartProvider } from "~/components/pos/cart-store";
import { POSTerminal } from "~/components/pos/pos-terminal";

export const metadata = {
  title: "Point of Sale · Kapabara",
};

export default async function POSPage() {
  const session = await requireRole("CASHIER");
  const categories = await api.product.categories();

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase D1 · Sell
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-espresso-900 sm:text-4xl">
            Point of Sale
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Tap a product to add to cart. Use the scanner to add by SKU.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <ShoppingCart className="size-4" />
          <span>
            Cashier: <strong className="text-fg">{session.user.name}</strong>
          </span>
        </div>
      </section>

      <CartProvider>
        <POSTerminal
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
            slug: c.slug,
            productCount: c._count.products,
          }))}
        />
      </CartProvider>
    </div>
  );
}
