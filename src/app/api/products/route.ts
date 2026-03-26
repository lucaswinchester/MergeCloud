import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { organizationSettings } from "@/db/schema";
import { getProductsForRole } from "@/server/services/productService";

// GET /api/products - List products with role-appropriate pricing
export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up org permissions to determine role
    const db = getDb();
    const [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.clerkOrgId, orgId))
      .limit(1);

    const isWholesaler = settings?.isWholesaler ?? false;
    const isRetailer = settings?.isRetailer ?? false;

    if (!isRetailer && !isWholesaler) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;

    // Wholesalers see wholesale pricing; retailers see retail pricing
    const role = isWholesaler ? "wholesale" : "retail";
    const items = await getProductsForRole(role as "retail" | "wholesale", category);

    return NextResponse.json({ products: items, role });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
