import { requirePermission } from "@/lib/page-guard";

export default async function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("isWholesaler");
  return <>{children}</>;
}
