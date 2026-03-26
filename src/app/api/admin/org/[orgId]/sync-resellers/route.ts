import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { syncResellerCredentials } from "@/lib/sync-reseller-credentials";

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

  // Get org API key
  const [orgSettings] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.clerkOrgId, orgId))
    .limit(1);

  if (
    !orgSettings?.encryptedApiKey ||
    !orgSettings?.apiKeyIv ||
    !orgSettings?.apiKeyTag
  ) {
    return NextResponse.json(
      { error: "Organization API key not configured" },
      { status: 400 }
    );
  }

  const apiKey = decrypt(
    orgSettings.encryptedApiKey,
    orgSettings.apiKeyIv,
    orgSettings.apiKeyTag
  );

  try {
    const result = await syncResellerCredentials(orgId, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reseller sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync reseller credentials" },
      { status: 500 }
    );
  }
}
