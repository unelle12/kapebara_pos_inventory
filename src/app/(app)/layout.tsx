import { requireUser } from "~/lib/auth-helpers";
import { visibleSections } from "~/lib/nav";
import { AppShell } from "~/components/layout/app-shell";
import { SkipLink } from "~/components/layout/skip-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const sections = visibleSections(session.user.role);
  return (
    <>
      <SkipLink />
      <AppShell sections={sections}>{children}</AppShell>
    </>
  );
}
