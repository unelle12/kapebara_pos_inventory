import { requireRole } from "~/lib/auth-helpers";
import NewUserForm from "./NewUserForm";

export const metadata = {
  title: "Add user · Kapabara",
};

export default async function NewUserPage() {
  await requireRole("OWNER");
  return (
    <div className="space-y-6">
      <NewUserForm />
    </div>
  );
}
