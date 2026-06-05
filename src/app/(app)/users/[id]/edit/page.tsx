import { notFound } from "next/navigation";

import { requireRole } from "~/lib/auth-helpers";
import { api } from "~/trpc/server";
import EditUserForm from "./EditUserForm";

export const metadata = {
  title: "Edit user · Kapabara",
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("OWNER");
  const { id } = await params;
  if (!/^c[a-z0-9]{20,}$/i.test(id)) notFound();

  let user;
  try {
    user = await api.user.byId({ id });
  } catch {
    notFound();
  }
  if (!user) notFound();

  return <EditUserForm user={user} />;
}
