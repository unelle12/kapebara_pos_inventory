import { requireRole } from "~/lib/auth-helpers";

export const metadata = {
  title: "Add supplier · Kapabara",
};

export default async function NewSupplierPage() {
  await requireRole("MANAGER");

  return (
    <div className="space-y-6">
      <NewSupplierForm />
    </div>
  );
}

import NewSupplierForm from "./NewSupplierForm";