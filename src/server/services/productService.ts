/**
 * Product Service
 *
 * Manages the product catalog. Returns role-appropriate pricing
 * and applies wholesale tier pricing for bulk orders.
 */

import { eq, and, asc } from "drizzle-orm";
import {
  getDb,
  isDatabaseConfigured,
  products,
  type Product,
  type NewProduct,
} from "@/db/client";

type OrgRole = "retail" | "wholesale";

interface ProductForRole {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  features: string[] | null;
  specifications: Record<string, string> | null;
  price: number;
  leasePrice: number | null;
  wholesalePricingTiers?: Array<{ minQty: number; price: number; leasePrice?: number }> | null;
  wholesaleMinOrderQty?: number | null;
  inStock: boolean | null;
  supportsDropship: boolean | null;
  supportsInventory: boolean | null;
}

/**
 * Get products filtered by role and optional category.
 * Wholesale prices are never exposed to retail-only orgs.
 */
export async function getProductsForRole(
  role: OrgRole,
  category?: string
): Promise<ProductForRole[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();

  const conditions = [eq(products.isActive, true)];

  if (role === "retail") {
    conditions.push(eq(products.availableForRetail, true));
  } else {
    conditions.push(eq(products.availableForWholesale, true));
  }

  if (category) {
    conditions.push(eq(products.category, category));
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.sortOrder), asc(products.name));

  return rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    imageUrl: p.imageUrl,
    features: p.features,
    specifications: p.specifications,
    price: role === "wholesale" ? (p.wholesalePrice ?? p.retailPrice) : p.retailPrice,
    leasePrice:
      role === "wholesale"
        ? (p.wholesaleLeasePrice ?? p.retailLeasePrice)
        : p.retailLeasePrice,
    wholesalePricingTiers: role === "wholesale" ? p.wholesalePricingTiers : undefined,
    wholesaleMinOrderQty: role === "wholesale" ? p.wholesaleMinOrderQty : undefined,
    inStock: p.inStock,
    supportsDropship: p.supportsDropship,
    supportsInventory: p.supportsInventory,
  }));
}

/**
 * Get a single product by ID (full record for validation).
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!isDatabaseConfigured()) return null;

  const db = getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product ?? null;
}

/**
 * Get all products (admin view, no role filtering).
 */
export async function getAllProducts(category?: string): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];

  const db = getDb();
  const conditions = category ? [eq(products.category, category)] : [];

  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.sortOrder), asc(products.name));
}

/**
 * Create a new product (admin only).
 */
export async function createProduct(data: NewProduct): Promise<Product> {
  const db = getDb();
  const [created] = await db.insert(products).values(data).returning();
  return created;
}

/**
 * Update an existing product (admin only).
 */
export async function updateProduct(
  id: string,
  data: Partial<NewProduct>
): Promise<Product | null> {
  const db = getDb();
  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Soft-delete a product (set isActive = false).
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDb();
  const [updated] = await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return !!updated;
}

/**
 * Calculate the effective price for a product given quantity and role.
 * Applies wholesale tier pricing for wholesale orders.
 */
export function calculatePrice(
  product: Product,
  quantity: number,
  role: OrgRole,
  paymentOption: "purchase" | "lease" = "purchase"
): { unitPrice: number; subtotal: number } {
  if (role === "wholesale" && product.wholesalePricingTiers?.length) {
    // Find the best matching tier (highest minQty that quantity meets)
    const tiers = [...product.wholesalePricingTiers].sort(
      (a, b) => b.minQty - a.minQty
    );
    const matchedTier = tiers.find((t) => quantity >= t.minQty);

    if (matchedTier) {
      const unitPrice =
        paymentOption === "lease" && matchedTier.leasePrice
          ? matchedTier.leasePrice
          : matchedTier.price;
      return { unitPrice, subtotal: unitPrice * quantity };
    }

    // Fall back to base wholesale price
    const basePrice =
      paymentOption === "lease"
        ? (product.wholesaleLeasePrice ?? product.wholesalePrice ?? product.retailPrice)
        : (product.wholesalePrice ?? product.retailPrice);
    return { unitPrice: basePrice, subtotal: basePrice * quantity };
  }

  // Retail pricing
  const unitPrice =
    paymentOption === "lease"
      ? (product.retailLeasePrice ?? product.retailPrice)
      : product.retailPrice;

  return { unitPrice, subtotal: unitPrice * quantity };
}
