export type FulfillmentType = "inventory" | "dropship";

export type OrgRole = "retail" | "wholesale";

export interface CatalogProduct {
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
  wholesalePricingTiers?: Array<{
    minQty: number;
    price: number;
    leasePrice?: number;
  }> | null;
  wholesaleMinOrderQty?: number | null;
  inStock: boolean | null;
  supportsDropship: boolean | null;
  supportsInventory: boolean | null;
}

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
  paymentOption: "purchase" | "lease";
}
