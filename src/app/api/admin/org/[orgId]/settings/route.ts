import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId } = await params;

  // Get org name from Clerk
  let orgName = "Unknown";
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    orgName = org.name;
  } catch {
    // ignore
  }

  const [settings] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.clerkOrgId, orgId))
    .limit(1);

  return NextResponse.json({
    clerkOrgId: orgId,
    orgName,
    hasApiKey: Boolean(settings?.encryptedApiKey),
    isRetailer: settings?.isRetailer ?? false,
    isWholesaler: settings?.isWholesaler ?? false,
    sparqfiPermissions: settings?.sparqfiPermissions ?? {},
    lastPermissionSync: settings?.lastPermissionSync?.toISOString() ?? null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId } = await params;
  const body = await req.json();

  // Get org display name from Clerk
  let orgDisplayName: string | undefined;
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    orgDisplayName = org.name;
  } catch {
    // ignore
  }

  // Check if settings exist
  const [existing] = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.clerkOrgId, orgId))
    .limit(1);

  const updateData: Record<string, unknown> = {
    isRetailer: body.isRetailer ?? false,
    isWholesaler: body.isWholesaler ?? false,
    updatedAt: new Date(),
  };

  if (body.sparqfiPermissions) {
    updateData.sparqfiPermissions = body.sparqfiPermissions;
  }

  if (orgDisplayName) {
    updateData.orgDisplayName = orgDisplayName;
  }

  // If a new API key is provided, encrypt and store it
  if (body.apiKey && typeof body.apiKey === "string" && body.apiKey.trim()) {
    const { ciphertext, iv, tag } = encrypt(body.apiKey.trim());
    updateData.encryptedApiKey = ciphertext;
    updateData.apiKeyIv = iv;
    updateData.apiKeyTag = tag;
  }

  if (existing) {
    await db
      .update(organizationSettings)
      .set(updateData)
      .where(eq(organizationSettings.clerkOrgId, orgId));
  } else {
    await db.insert(organizationSettings).values({
      clerkOrgId: orgId,
      ...updateData,
    } as any);
  }

  return NextResponse.json({ success: true });
}
