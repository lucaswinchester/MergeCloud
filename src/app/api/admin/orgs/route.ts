import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

export async function GET() {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const client = await clerkClient();
  const { data: clerkOrgs } = await client.organizations.getOrganizationList({
    limit: 100,
  });

  // Fetch all org settings from our DB
  const allSettings = await db.select().from(organizationSettings);
  const settingsMap = new Map(
    allSettings.map((s) => [s.clerkOrgId, s])
  );

  const organizations = await Promise.all(
    clerkOrgs.map(async (org) => {
      const settings = settingsMap.get(org.id);
      let membersCount = 0;
      try {
        const { totalCount } =
          await client.organizations.getOrganizationMembershipList({
            organizationId: org.id,
            limit: 1,
          });
        membersCount = totalCount;
      } catch {
        // ignore
      }

      return {
        id: org.id,
        name: org.name,
        membersCount,
        hasApiKey: Boolean(settings?.encryptedApiKey),
        isRetailer: settings?.isRetailer ?? false,
        isWholesaler: settings?.isWholesaler ?? false,
      };
    })
  );

  return NextResponse.json({ organizations });
}
