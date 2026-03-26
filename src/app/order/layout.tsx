import { requireAnyPermission } from "@/lib/page-guard";

export default async function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAnyPermission(["isRetailer", "isWholesaler"]);
  return <>{children}</>;
}
