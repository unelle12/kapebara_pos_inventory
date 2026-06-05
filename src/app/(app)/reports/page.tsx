import { requireRole } from "~/lib/auth-helpers";
import { ReportsClient } from "~/components/reports/reports-client";

export const metadata = {
  title: "Reports · Kapabara",
};

type SearchParams = Promise<{
  range?: string;
}>;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("MANAGER");
  const sp = await searchParams;
  const range = (sp.range as "7d" | "30d" | "90d" | "all" | undefined) ?? "30d";

  return <ReportsClient range={range} />;
}
