import { requirePermission } from "@/lib/page-guard";

export default async function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("isRetailer");
  return <>{children}</>;
}
