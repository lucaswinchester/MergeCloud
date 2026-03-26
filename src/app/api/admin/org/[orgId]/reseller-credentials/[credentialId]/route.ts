import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userApiCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

// DELETE — Revoke a credential
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; credentialId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId, credentialId } = await params;

  // Verify credential belongs to this org
  const [cred] = await db
    .select()
    .from(userApiCredentials)
    .where(
      and(
        eq(userApiCredentials.id, credentialId),
        eq(userApiCredentials.clerkOrgId, orgId)
      )
    )
    .limit(1);

  if (!cred) {
    return NextResponse.json(
      { error: "Credential not found" },
      { status: 404 }
    );
  }

  await db
    .update(userApiCredentials)
    .set({
      syncStatus: "revoked",
      encryptedApiKey: null,
      apiKeyIv: null,
      apiKeyTag: null,
      updatedAt: new Date(),
    })
    .where(eq(userApiCredentials.id, credentialId));

  return NextResponse.json({ success: true });
}
