import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings, userApiCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const [orgSettings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.clerkOrgId, orgId))
      .limit(1);

    if (!orgSettings) {
      return NextResponse.json({
        isRetailer: false,
        isWholesaler: false,
        sparqfiPermissions: {},
        hasApiKey: false,
        hasDeviceAccess: false,
      });
    }

    // Check device access: admins always have it, non-admins need credentials
    let hasDeviceAccess = false;

    // Check admin status
    let isAdmin = orgRole === "org:admin";
    if (!isAdmin) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        isAdmin = user.publicMetadata?.isSuperAdmin === true;
      } catch {
        // proceed as non-admin
      }
    }

    if (isAdmin) {
      hasDeviceAccess = true;
    } else {
      // Non-admin: check for active credentials
      const [cred] = await db
        .select({ id: userApiCredentials.id, syncStatus: userApiCredentials.syncStatus })
        .from(userApiCredentials)
        .where(
          and(
            eq(userApiCredentials.clerkUserId, userId),
            eq(userApiCredentials.clerkOrgId, orgId),
            eq(userApiCredentials.platform, "sparqfi")
          )
        )
        .limit(1);

      hasDeviceAccess = Boolean(cred && cred.syncStatus !== "revoked");
    }

    return NextResponse.json({
      isRetailer: orgSettings.isRetailer ?? false,
      isWholesaler: orgSettings.isWholesaler ?? false,
      sparqfiPermissions: orgSettings.sparqfiPermissions ?? {},
      hasApiKey: Boolean(orgSettings.encryptedApiKey),
      hasDeviceAccess,
    });
  } catch {
    // Table may not exist yet (migration not run) — return permissive defaults
    return NextResponse.json({
      isRetailer: true,
      isWholesaler: true,
      sparqfiPermissions: {},
      hasApiKey: false,
      hasDeviceAccess: false,
    });
  }
}
