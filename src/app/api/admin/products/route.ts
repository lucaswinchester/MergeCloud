import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getAllProducts,
  createProduct,
} from "@/server/services/productService";

async function requireSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user?.publicMetadata?.isSuperAdmin) return null;
  return user;
}

// GET /api/admin/products - List all products (admin view)
export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const items = await getAllProducts(category);
    return NextResponse.json({ products: items });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product
export async function POST(request: NextRequest) {
  const user = await requireSuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.sku || !body.name || !body.category || body.retailPrice == null) {
      return NextResponse.json(
        { error: "Missing required fields: sku, name, category, retailPrice" },
        { status: 400 }
      );
    }

    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "23505") {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
