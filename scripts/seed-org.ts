/**
 * One-shot seed script for organization_settings.
 *
 * Usage:
 *   npx tsx scripts/seed-org.ts <CLERK_ORG_ID>
 *
 * Reads IQMC_API_KEY and ENCRYPTION_KEY from .env.local,
 * encrypts the API key, and upserts an organization_settings row
 * with all permissions enabled.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createCipheriv, randomBytes } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { organizationSettings } from "../src/db/schema";

const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext: string) {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string");
  }
  const keyBuf = Buffer.from(key, "hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

async function main() {
  const clerkOrgId = process.argv[2];
  if (!clerkOrgId) {
    console.error("Usage: npx tsx scripts/seed-org.ts <CLERK_ORG_ID>");
    console.error("  Get your Clerk org ID from the Clerk dashboard.");
    process.exit(1);
  }

  const apiKey = process.env.IQMC_API_KEY;
  if (!apiKey) {
    console.error("IQMC_API_KEY not found in .env.local");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  console.log(`Encrypting API key...`);
  const { ciphertext, iv, tag } = encrypt(apiKey);

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  const db = drizzle(client);

  const allPerms = {
    canActivate: true,
    canDeactivate: true,
    canUpdateFirmware: true,
    canPortForward: true,
    canDedicatedIp: true,
    canBridgedIp: true,
    canConfigBackup: true,
    canViewReports: true,
  };

  console.log(`Upserting organization_settings for org: ${clerkOrgId}`);

  await db
    .insert(organizationSettings)
    .values({
      clerkOrgId,
      encryptedApiKey: ciphertext,
      apiKeyIv: iv,
      apiKeyTag: tag,
      isRetailer: true,
      isWholesaler: true,
      sparqfiPermissions: allPerms,
      orgDisplayName: "Partner Portal",
      lastPermissionSync: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationSettings.clerkOrgId,
      set: {
        encryptedApiKey: ciphertext,
        apiKeyIv: iv,
        apiKeyTag: tag,
        isRetailer: true,
        isWholesaler: true,
        sparqfiPermissions: allPerms,
        lastPermissionSync: new Date(),
        updatedAt: new Date(),
      },
    });

  // Verify the insert
  const [row] = await db
    .select({
      id: organizationSettings.id,
      clerkOrgId: organizationSettings.clerkOrgId,
      isRetailer: organizationSettings.isRetailer,
      isWholesaler: organizationSettings.isWholesaler,
      hasKey: organizationSettings.encryptedApiKey,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.clerkOrgId, clerkOrgId))
    .limit(1);

  if (row) {
    console.log(`\nSeeded successfully:`);
    console.log(`  ID:           ${row.id}`);
    console.log(`  Clerk Org:    ${row.clerkOrgId}`);
    console.log(`  isRetailer:   ${row.isRetailer}`);
    console.log(`  isWholesaler: ${row.isWholesaler}`);
    console.log(`  API Key:      ${row.hasKey ? "encrypted" : "missing"}`);
  } else {
    console.error("Insert failed — no row found after upsert.");
    process.exit(1);
  }

  await client.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
