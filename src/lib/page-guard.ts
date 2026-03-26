import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

type PermissionCheck = "isRetailer" | "isWholesaler";

/**
 * Server-side page guard. Call at the top of server components
 * that require a specific org permission. Redirects to /dashboard if denied.
 */
export async function requirePermission(permission: PermissionCheck) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/dashboard");
  }

  try {
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.clerkOrgId, orgId))
      .limit(1);

    if (!settings || !settings[permission]) {
      redirect("/dashboard");
    }

    return settings;
  } catch {
    // Table may not exist yet (migration not run) — allow access
    return null;
  }
}

/**
 * Server-side page guard that passes if the org has ANY of the listed permissions.
 */
export async function requireAnyPermission(permissions: PermissionCheck[]) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/dashboard");
  }

  try {
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.clerkOrgId, orgId))
      .limit(1);

    if (!settings || !permissions.some((p) => settings[p])) {
      redirect("/dashboard");
    }

    return settings;
  } catch {
    return null;
  }
}
