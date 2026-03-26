import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { syncSparqfiPermissions } from "@/lib/sync-permissions";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId } = await params;

  // Get org settings with encrypted API key
  const [settings] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.clerkOrgId, orgId))
    .limit(1);

  if (
    !settings?.encryptedApiKey ||
    !settings.apiKeyIv ||
    !settings.apiKeyTag
  ) {
    return NextResponse.json(
      { error: "No API key configured for this organization" },
      { status: 400 }
    );
  }

  const apiKey = decrypt(
    settings.encryptedApiKey,
    settings.apiKeyIv,
    settings.apiKeyTag
  );

  const permissions = await syncSparqfiPermissions(orgId, apiKey);

  return NextResponse.json({ permissions });
}
