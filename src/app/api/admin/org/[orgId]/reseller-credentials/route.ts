import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userApiCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

// GET — List all reseller credentials for an org
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId } = await params;

  const credentials = await db
    .select({
      id: userApiCredentials.id,
      clerkUserId: userApiCredentials.clerkUserId,
      platform: userApiCredentials.platform,
      platformUserId: userApiCredentials.platformUserId,
      platformEmail: userApiCredentials.platformEmail,
      syncStatus: userApiCredentials.syncStatus,
      metadata: userApiCredentials.metadata,
      lastSyncedAt: userApiCredentials.lastSyncedAt,
      createdAt: userApiCredentials.createdAt,
    })
    .from(userApiCredentials)
    .where(
      and(
        eq(userApiCredentials.clerkOrgId, orgId),
        eq(userApiCredentials.platform, "sparqfi")
      )
    );

  return NextResponse.json({ credentials });
}

// PUT — Manually assign a credential to a Clerk user
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

  const { clerkUserId, platformUserId, platformEmail, apiKey } = body;

  if (!clerkUserId || !platformUserId) {
    return NextResponse.json(
      { error: "clerkUserId and platformUserId are required" },
      { status: 400 }
    );
  }

  const now = new Date();
  const values: Record<string, unknown> = {
    clerkUserId,
    clerkOrgId: orgId,
    platform: "sparqfi",
    platformUserId,
    platformEmail: platformEmail ?? null,
    syncStatus: "manual",
    lastSyncedAt: now,
    updatedAt: now,
  };

  if (apiKey && typeof apiKey === "string") {
    const { ciphertext, iv, tag } = encrypt(apiKey);
    values.encryptedApiKey = ciphertext;
    values.apiKeyIv = iv;
    values.apiKeyTag = tag;
  }

  // Upsert: check if credential already exists
  const [existing] = await db
    .select()
    .from(userApiCredentials)
    .where(
      and(
        eq(userApiCredentials.clerkUserId, clerkUserId),
        eq(userApiCredentials.clerkOrgId, orgId),
        eq(userApiCredentials.platform, "sparqfi")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(userApiCredentials)
      .set(values)
      .where(eq(userApiCredentials.id, existing.id));
  } else {
    await db.insert(userApiCredentials).values(values as typeof userApiCredentials.$inferInsert);
  }

  return NextResponse.json({ success: true });
}
