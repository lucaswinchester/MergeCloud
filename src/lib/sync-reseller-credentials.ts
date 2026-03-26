import { db } from "@/db";
import { userApiCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { encrypt } from "@/lib/crypto";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

// ── Provider interface ───────────────────────────────────────────────
// Abstracts the SparqFi sub-reseller endpoints so the matching/storage
// logic doesn't change when endpoint URLs or response shapes differ.

export interface SubReseller {
  uuid: string;
  email: string;
  name?: string;
}

export interface SparqfiResellerProvider {
  /** Fetch all sub-resellers for the org. Returns UUIDs + emails (no keys). */
  listSubResellers(orgApiKey: string): Promise<SubReseller[]>;
  /** Fetch or generate the API key for a specific sub-reseller UUID. */
  getResellerApiKey(orgApiKey: string, resellerUuid: string): Promise<string>;
}

// ── Default provider (calls SparqFi API) ─────────────────────────────
// Endpoint URLs are centralised here — update when SparqFi docs confirm.

const defaultProvider: SparqfiResellerProvider = {
  async listSubResellers(orgApiKey: string): Promise<SubReseller[]> {
    const res = await fetch(`${API_BASE_URL}/reseller/sub-resellers`, {
      method: "GET",
      headers: { Accept: "application/json", "X-API-KEY": orgApiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to list sub-resellers: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // Normalise whatever shape the API returns
    const list: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.resellers ?? [];
    return list.map((r: Record<string, unknown>) => ({
      uuid: (r.uuid ?? r.id) as string,
      email: ((r.email ?? "") as string).toLowerCase().trim(),
      name: (r.name ?? r.label ?? undefined) as string | undefined,
    }));
  },

  async getResellerApiKey(orgApiKey: string, resellerUuid: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/reseller/${resellerUuid}/api-key`, {
      method: "POST",
      headers: { Accept: "application/json", "X-API-KEY": orgApiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Failed to get API key for reseller ${resellerUuid}: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    const key = data?.api_key ?? data?.apiKey ?? data?.key;
    if (!key || typeof key !== "string") {
      throw new Error(`No API key returned for reseller ${resellerUuid}`);
    }
    return key;
  },
};

// ── Sync function ────────────────────────────────────────────────────

export interface SyncResult {
  matched: { clerkUserId: string; email: string; resellerUuid: string }[];
  unmatched: SubReseller[];
  revoked: string[]; // credential IDs that were revoked
  errors: string[];
}

export async function syncResellerCredentials(
  clerkOrgId: string,
  orgApiKey: string,
  provider: SparqfiResellerProvider = defaultProvider
): Promise<SyncResult> {
  const result: SyncResult = { matched: [], unmatched: [], revoked: [], errors: [] };

  // 1. Fetch sub-resellers from SparqFi
  let subResellers: SubReseller[];
  try {
    subResellers = await provider.listSubResellers(orgApiKey);
  } catch (err) {
    result.errors.push(`Failed to list sub-resellers: ${err}`);
    return result;
  }

  // 2. Fetch Clerk org members
  const client = await clerkClient();
  const membershipList = await client.organizations.getOrganizationMembershipList({
    organizationId: clerkOrgId,
    limit: 500,
  });

  // Build email → Clerk user map (case-insensitive)
  const clerkMembersByEmail = new Map<string, { userId: string; email: string }>();
  for (const m of membershipList.data) {
    const email = m.publicUserData?.identifier?.toLowerCase().trim();
    if (email && m.publicUserData?.userId) {
      clerkMembersByEmail.set(email, {
        userId: m.publicUserData.userId,
        email,
      });
    }
  }

  // 3. Match sub-resellers to Clerk members by email
  const matchedResellerUuids = new Set<string>();

  for (const reseller of subResellers) {
    const clerkMember = clerkMembersByEmail.get(reseller.email);
    if (!clerkMember) {
      result.unmatched.push(reseller);
      continue;
    }

    matchedResellerUuids.add(reseller.uuid);

    // 4. Fetch per-reseller API key
    let resellerApiKey: string;
    try {
      resellerApiKey = await provider.getResellerApiKey(orgApiKey, reseller.uuid);
    } catch (err) {
      result.errors.push(`Failed to get key for ${reseller.email}: ${err}`);
      continue;
    }

    // 5. Encrypt and upsert
    const { ciphertext, iv, tag } = encrypt(resellerApiKey);

    const [existing] = await db
      .select()
      .from(userApiCredentials)
      .where(
        and(
          eq(userApiCredentials.clerkUserId, clerkMember.userId),
          eq(userApiCredentials.clerkOrgId, clerkOrgId),
          eq(userApiCredentials.platform, "sparqfi")
        )
      )
      .limit(1);

    const now = new Date();
    if (existing) {
      await db
        .update(userApiCredentials)
        .set({
          platformUserId: reseller.uuid,
          platformEmail: reseller.email,
          encryptedApiKey: ciphertext,
          apiKeyIv: iv,
          apiKeyTag: tag,
          syncStatus: "matched",
          lastSyncedAt: now,
          updatedAt: now,
          metadata: { resellerName: reseller.name },
        })
        .where(eq(userApiCredentials.id, existing.id));
    } else {
      await db.insert(userApiCredentials).values({
        clerkUserId: clerkMember.userId,
        clerkOrgId,
        platform: "sparqfi",
        platformUserId: reseller.uuid,
        platformEmail: reseller.email,
        encryptedApiKey: ciphertext,
        apiKeyIv: iv,
        apiKeyTag: tag,
        syncStatus: "matched",
        lastSyncedAt: now,
        metadata: { resellerName: reseller.name },
      });
    }

    result.matched.push({
      clerkUserId: clerkMember.userId,
      email: reseller.email,
      resellerUuid: reseller.uuid,
    });
  }

  // 6. Revoke credentials for resellers that no longer exist
  const existingCreds = await db
    .select()
    .from(userApiCredentials)
    .where(
      and(
        eq(userApiCredentials.clerkOrgId, clerkOrgId),
        eq(userApiCredentials.platform, "sparqfi")
      )
    );

  for (const cred of existingCreds) {
    if (
      cred.platformUserId &&
      cred.syncStatus === "matched" &&
      !matchedResellerUuids.has(cred.platformUserId)
    ) {
      await db
        .update(userApiCredentials)
        .set({ syncStatus: "revoked", updatedAt: new Date() })
        .where(eq(userApiCredentials.id, cred.id));
      result.revoked.push(cred.id);
    }
  }

  return result;
}

// ── Single-user sync ─────────────────────────────────────────────────
// Used by the Clerk webhook when a new member joins an org.

export interface SingleUserSyncResult {
  matched: boolean;
  resellerUuid?: string;
  error?: string;
}

export async function syncSingleUserCredentials(
  clerkUserId: string,
  userEmail: string,
  clerkOrgId: string,
  orgApiKey: string,
  provider: SparqfiResellerProvider = defaultProvider
): Promise<SingleUserSyncResult> {
  // 1. Fetch sub-resellers from SparqFi
  let subResellers: SubReseller[];
  try {
    subResellers = await provider.listSubResellers(orgApiKey);
  } catch (err) {
    return { matched: false, error: `Failed to list sub-resellers: ${err}` };
  }

  // 2. Find matching sub-reseller by email
  const normalizedEmail = userEmail.toLowerCase().trim();
  const matchedReseller = subResellers.find((r) => r.email === normalizedEmail);

  if (!matchedReseller) {
    return { matched: false };
  }

  // 3. Fetch per-reseller API key
  let resellerApiKey: string;
  try {
    resellerApiKey = await provider.getResellerApiKey(orgApiKey, matchedReseller.uuid);
  } catch (err) {
    return { matched: false, error: `Failed to get API key: ${err}` };
  }

  // 4. Encrypt and upsert
  const { ciphertext, iv, tag } = encrypt(resellerApiKey);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(userApiCredentials)
    .where(
      and(
        eq(userApiCredentials.clerkUserId, clerkUserId),
        eq(userApiCredentials.clerkOrgId, clerkOrgId),
        eq(userApiCredentials.platform, "sparqfi")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(userApiCredentials)
      .set({
        platformUserId: matchedReseller.uuid,
        platformEmail: matchedReseller.email,
        encryptedApiKey: ciphertext,
        apiKeyIv: iv,
        apiKeyTag: tag,
        syncStatus: "matched",
        lastSyncedAt: now,
        updatedAt: now,
        metadata: { resellerName: matchedReseller.name },
      })
      .where(eq(userApiCredentials.id, existing.id));
  } else {
    await db.insert(userApiCredentials).values({
      clerkUserId,
      clerkOrgId,
      platform: "sparqfi",
      platformUserId: matchedReseller.uuid,
      platformEmail: matchedReseller.email,
      encryptedApiKey: ciphertext,
      apiKeyIv: iv,
      apiKeyTag: tag,
      syncStatus: "matched",
      lastSyncedAt: now,
      metadata: { resellerName: matchedReseller.name },
    });
  }

  return { matched: true, resellerUuid: matchedReseller.uuid };
}
