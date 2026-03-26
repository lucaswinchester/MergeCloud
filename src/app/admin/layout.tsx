import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const isSuperAdmin = user.publicMetadata?.isSuperAdmin === true;

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
