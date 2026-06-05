import { notFound } from "next/navigation";
import { requireRole } from "~/lib/auth-helpers";
import { api } from "~/trpc/server";
import EditSupplierForm from "./EditSupplierForm";

export const metadata = {
  title: "Edit supplier · Kapabara",
};

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("MANAGER");
  const { id } = await params;

  let supplier;
  try {
    supplier = await api.supplier.byId({ id });
  } catch {
    notFound();
  }
  if (!supplier) notFound();

  return <EditSupplierForm supplier={supplier} />;
}
