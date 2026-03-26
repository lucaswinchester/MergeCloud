import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings, userApiCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

export interface OrgPermissions {
  isRetailer: boolean;
  isWholesaler: boolean;
  sparqfi: Record<string, boolean>;
}

export interface OrgAuthContext {
  userId: string;
  orgId: string;
  apiKey: string;
  permissions: OrgPermissions;
}

/**
 * Wraps an API route handler with org-level authentication.
 * Resolves Clerk auth, fetches the org's encrypted API key, decrypts it,
 * and passes everything to the handler via OrgAuthContext.
 */
export function withOrgAuth(
  handler: (ctx: OrgAuthContext, req: NextRequest) => Promise<NextResponse>
): (req: NextRequest, routeCtx?: any) => Promise<NextResponse> {
  return async (req: NextRequest, routeCtx?: any) => {
    try {
      const { userId, orgId } = await auth();

      if (!userId || !orgId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const [orgSettings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.clerkOrgId, orgId))
        .limit(1);

      if (
        !orgSettings ||
        !orgSettings.encryptedApiKey ||
        !orgSettings.apiKeyIv ||
        !orgSettings.apiKeyTag
      ) {
        return NextResponse.json(
          { error: "Organization not configured. Contact your administrator." },
          { status: 403 }
        );
      }

      const apiKey = decrypt(
        orgSettings.encryptedApiKey,
        orgSettings.apiKeyIv,
        orgSettings.apiKeyTag
      );

      const permissions: OrgPermissions = {
        isRetailer: orgSettings.isRetailer ?? false,
        isWholesaler: orgSettings.isWholesaler ?? false,
        sparqfi: (orgSettings.sparqfiPermissions as Record<string, boolean>) ?? {},
      };

      return handler({ userId, orgId, apiKey, permissions }, req);
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// ── Platform-level auth (per-user device scoping) ────────────────────

export interface PlatformAuthContext extends OrgAuthContext {
  orgApiKey: string;
  platformCredentials: { apiKey: string; platformUserId: string } | null;
  isOrgAdmin: boolean;
  effectiveApiKey: string;
  isScoped: boolean;
  resellerUuid: string | null;
}

/**
 * Wraps an API route handler with platform-level authentication.
 * Non-admin users get scoped to their own SparqFi sub-reseller credentials.
 * Admins (org:admin or super admin) bypass scoping and use the org-level key.
 */
export function withPlatformAuth(
  platform: string,
  handler: (ctx: PlatformAuthContext, req: NextRequest) => Promise<NextResponse>
): (req: NextRequest, routeCtx?: any) => Promise<NextResponse> {
  return async (req: NextRequest, routeCtx?: any) => {
    try {
      const { userId, orgId, orgRole } = await auth();

      if (!userId || !orgId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Fetch org settings + decrypt org-level API key
      const [orgSettings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.clerkOrgId, orgId))
        .limit(1);

      if (
        !orgSettings ||
        !orgSettings.encryptedApiKey ||
        !orgSettings.apiKeyIv ||
        !orgSettings.apiKeyTag
      ) {
        return NextResponse.json(
          { error: "Organization not configured. Contact your administrator." },
          { status: 403 }
        );
      }

      const orgApiKey = decrypt(
        orgSettings.encryptedApiKey,
        orgSettings.apiKeyIv,
        orgSettings.apiKeyTag
      );

      const permissions: OrgPermissions = {
        isRetailer: orgSettings.isRetailer ?? false,
        isWholesaler: orgSettings.isWholesaler ?? false,
        sparqfi: (orgSettings.sparqfiPermissions as Record<string, boolean>) ?? {},
      };

      // Check admin status: orgRole first (cheap), then super admin (needs API call)
      let isOrgAdmin = orgRole === "org:admin";

      if (!isOrgAdmin) {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          isOrgAdmin = user.publicMetadata?.isSuperAdmin === true;
        } catch {
          // If we can't check super admin status, proceed as non-admin
        }
      }

      // Admin path: bypass scoping
      if (isOrgAdmin) {
        return handler(
          {
            userId,
            orgId,
            apiKey: orgApiKey,
            permissions,
            orgApiKey,
            platformCredentials: null,
            isOrgAdmin: true,
            effectiveApiKey: orgApiKey,
            isScoped: false,
            resellerUuid: null,
          },
          req
        );
      }

      // Non-admin path: look up per-user credentials
      const [cred] = await db
        .select()
        .from(userApiCredentials)
        .where(
          and(
            eq(userApiCredentials.clerkUserId, userId),
            eq(userApiCredentials.clerkOrgId, orgId),
            eq(userApiCredentials.platform, platform)
          )
        )
        .limit(1);

      if (
        !cred ||
        cred.syncStatus === "revoked" ||
        !cred.encryptedApiKey ||
        !cred.apiKeyIv ||
        !cred.apiKeyTag
      ) {
        return NextResponse.json(
          { error: "No device access configured. Contact your administrator." },
          { status: 403 }
        );
      }

      const userApiKey = decrypt(cred.encryptedApiKey, cred.apiKeyIv, cred.apiKeyTag);

      return handler(
        {
          userId,
          orgId,
          apiKey: userApiKey,
          permissions,
          orgApiKey,
          platformCredentials: {
            apiKey: userApiKey,
            platformUserId: cred.platformUserId!,
          },
          isOrgAdmin: false,
          effectiveApiKey: userApiKey,
          isScoped: true,
          resellerUuid: cred.platformUserId ?? null,
        },
        req
      );
    } catch (error) {
      console.error("Platform auth error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
