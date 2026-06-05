import Link from "next/link";
import { requireRole } from "~/lib/auth-helpers";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Suppliers · kapabara",
};

export default async function SuppliersPage() {
  await requireRole("MANAGER");

  // Fetch suppliers for the table and toolbar
  const suppliersData = await api.supplier.list({
    page: 1,
    pageSize: 50, // capped at 50 by the router; toolbar count uses its own query
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-espresso-900">
          Suppliers
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/suppliers/new"
            className="rounded-xl border border-border px-3 py-1 text-sm font-medium text-fg-hover hover:bg-cream-50"
          >
            + New supplier
          </Link>
        </div>
      </div>

      <SuppliersToolbar />
      <SuppliersTable initialData={suppliersData} />
    </div>
  );
}

import { SuppliersTable } from "~/components/supplier/suppliers-table";
import { SuppliersToolbar } from "~/components/supplier/suppliers-toolbar";