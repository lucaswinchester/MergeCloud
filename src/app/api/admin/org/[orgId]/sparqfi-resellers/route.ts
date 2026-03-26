import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.isSuperAdmin !== true) return null;

  return userId;
}

// GET — Proxy to SparqFi to list sub-resellers (for admin UI dropdown)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const adminId = await verifySuperAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { orgId } = await params;

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
    const res = await fetch(`${API_BASE_URL}/reseller/sub-resellers`, {
      method: "GET",
      headers: { Accept: "application/json", "X-API-KEY": apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `SparqFi API error: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch sub-resellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sub-resellers from SparqFi" },
      { status: 500 }
    );
  }
}
