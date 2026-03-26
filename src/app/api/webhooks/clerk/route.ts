import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { syncSingleUserCredentials } from "@/lib/sync-reseller-credentials";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface WebhookEvent {
  type: string;
  data: Record<string, any>;
}

async function verifyWebhook(req: NextRequest): Promise<WebhookEvent | null> {
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return null;
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return null;
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  try {
    return wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const event = await verifyWebhook(req);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type === "organizationMembership.created") {
    const { organization, public_user_data } = event.data;
    const orgId = organization?.id as string | undefined;
    const userId = public_user_data?.user_id as string | undefined;
    const userEmail = public_user_data?.identifier as string | undefined;

    if (!orgId || !userId || !userEmail) {
      return NextResponse.json({ received: true, skipped: "missing data" });
    }

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
      // Org not configured yet — nothing to sync
      return NextResponse.json({ received: true, skipped: "org not configured" });
    }

    const apiKey = decrypt(
      orgSettings.encryptedApiKey,
      orgSettings.apiKeyIv,
      orgSettings.apiKeyTag
    );

    try {
      const result = await syncSingleUserCredentials(
        userId,
        userEmail,
        orgId,
        apiKey
      );
      console.log(
        `Webhook sync for ${userEmail} in org ${orgId}:`,
        result.matched ? `matched → ${result.resellerUuid}` : "no match"
      );
      return NextResponse.json({ received: true, ...result });
    } catch (error) {
      console.error("Webhook sync error:", error);
      return NextResponse.json({ received: true, error: "sync failed" });
    }
  }

  // Acknowledge other event types
  return NextResponse.json({ received: true });
}
