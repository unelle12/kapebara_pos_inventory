import { requireRole } from "~/lib/auth-helpers";

export const metadata = {
  title: "Restock inventory · Kapabara",
};

export default async function RestockPage() {
  await requireRole("MANAGER");

  return (
    <div className="min-h-[600px]">
      <RestockWizard />
    </div>
  );
}

import RestockWizard from "./RestockWizard";