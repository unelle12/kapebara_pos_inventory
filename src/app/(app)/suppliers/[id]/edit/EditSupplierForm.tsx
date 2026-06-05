"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupplierForm } from "~/components/supplier/supplier-form";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

interface SupplierData {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
}

export default function EditSupplierForm({
  supplier,
}: {
  supplier: SupplierData;
}) {
  const router = useRouter();

  const mutation = api.supplier.update.useMutation({
    onSuccess: (data: { id: string }) => {
      router.push(`/suppliers/${data.id}`);
    },
    onError: () => {
      alert("Failed to update supplier. Please try again.");
    },
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
            Phase C4 · Inventory
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-espresso-900 sm:text-5xl">
            Edit supplier
          </h1>
          <p className="mt-1 text-fg-muted">
            Update contact details and settings for {supplier.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/suppliers">
            <Button variant="outline" size="md">
              <ArrowLeft className="size-4" />
              All suppliers
            </Button>
          </Link>
        </div>
      </section>

      <SupplierForm
        onSubmit={async (formData) => {
          await mutation.mutateAsync({ id: supplier.id, ...formData });
        }}
        defaultValues={{
          name: supplier.name,
          contact: supplier.contact ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          notes: supplier.notes ?? "",
          active: supplier.active,
        }}
      />
    </div>
  );
}