/**
 * Seed script for the products table.
 * Run: npx tsx scripts/seed-products.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { products } from "../src/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

const seedProducts = [
  // ── Residential ──
  {
    sku: "IQMC-520",
    name: "IQMC-520",
    description: "5G Multi-Carrier router with full remote management capabilities.",
    category: "residential",
    imageUrl: "/images/IQMC_520.png",
    features: ["5G Multi-Carrier Hardware", "Full Remote Management"],
    specifications: { connectivity: "5G", management: "Remote", type: "Router" } as Record<string, string>,
    retailPrice: 595,
    retailLeasePrice: 14.99,
    wholesalePrice: 450,
    wholesaleLeasePrice: 10.99,
    wholesalePricingTiers: [
      { minQty: 1, price: 450, leasePrice: 10.99 },
      { minQty: 10, price: 420, leasePrice: 9.99 },
      { minQty: 50, price: 390, leasePrice: 8.99 },
      { minQty: 100, price: 360, leasePrice: 7.99 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: true,
    sortOrder: 1,
  },
  {
    sku: "IQMC-412",
    name: "IQMC-412",
    description: "4G Multi-Carrier router with full remote management capabilities.",
    category: "residential",
    imageUrl: "/images/IQMC412_Front_Silo_3_4.png",
    features: ["4G Multi-Carrier Hardware", "Full Remote Management"],
    specifications: { connectivity: "4G", management: "Remote", type: "Router" } as Record<string, string>,
    retailPrice: 395,
    retailLeasePrice: 14.99,
    wholesalePrice: 290,
    wholesaleLeasePrice: 10.99,
    wholesalePricingTiers: [
      { minQty: 1, price: 290, leasePrice: 10.99 },
      { minQty: 10, price: 270, leasePrice: 9.99 },
      { minQty: 50, price: 250, leasePrice: 8.99 },
      { minQty: 100, price: 230, leasePrice: 7.99 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: true,
    sortOrder: 2,
  },
  {
    sku: "IQMC-M11",
    name: "IQMC-M11",
    description: "4G Multi-Carrier mobile hotspot with full remote management.",
    category: "residential",
    imageUrl: "/images/RGN_IQMC_M11_Side.png",
    features: ["4G Multi-Carrier Hotspot", "Full Remote Management"],
    specifications: { connectivity: "4G", management: "Remote", type: "Hotspot" } as Record<string, string>,
    retailPrice: 159.99,
    retailLeasePrice: 14.99,
    wholesalePrice: 110,
    wholesaleLeasePrice: 10.99,
    wholesalePricingTiers: [
      { minQty: 1, price: 110, leasePrice: 10.99 },
      { minQty: 10, price: 100, leasePrice: 9.99 },
      { minQty: 50, price: 90, leasePrice: 8.99 },
      { minQty: 100, price: 80, leasePrice: 7.99 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: true,
    sortOrder: 3,
  },
  {
    sku: "IQMC-XDR",
    name: "IQMC-XDR",
    description: "5G weather-proof multi-carrier outdoor router with full remote management.",
    category: "residential",
    imageUrl: "/images/IQMC_Outdoor.png",
    features: ["5G Weather-Proof Multi-Carrier Hardware", "Full Remote Management"],
    specifications: { connectivity: "5G", management: "Remote", type: "Outdoor Router", rating: "IP67" } as Record<string, string>,
    retailPrice: 795,
    retailLeasePrice: 24.99,
    wholesalePrice: 600,
    wholesaleLeasePrice: 18.99,
    wholesalePricingTiers: [
      { minQty: 1, price: 600, leasePrice: 18.99 },
      { minQty: 10, price: 560, leasePrice: 16.99 },
      { minQty: 50, price: 520, leasePrice: 14.99 },
      { minQty: 100, price: 480, leasePrice: 12.99 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: true,
    sortOrder: 4,
  },

  // ── Business ──
  {
    sku: "SL-RGN-BONDED",
    name: "Starlink x RevGen Bonded",
    description: "Enterprise bonded connection combining Starlink and 5G IQMC hardware.",
    category: "business",
    imageUrl: "/images/IQMC_Outdoor.png",
    features: ["Starlink Enterprise Hardware", "5G IQMC Hardware", "Bonded Connection"],
    specifications: { connectivity: "Starlink + 5G", type: "Bonded Bundle" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1500,
    wholesaleLeasePrice: 400,
    wholesalePricingTiers: [
      { minQty: 1, price: 1500, leasePrice: 400 },
      { minQty: 5, price: 1400, leasePrice: 375 },
      { minQty: 10, price: 1300, leasePrice: 350 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 10,
  },
  {
    sku: "SL-RGN-BACKUP",
    name: "Starlink x RevGen Backup",
    description: "Primary Starlink with 5G IQMC backup failover.",
    category: "business",
    imageUrl: "/images/IQMC_Outdoor.png",
    features: ["Starlink Enterprise Hardware", "5G IQMC Hardware", "Automatic Failover"],
    specifications: { connectivity: "Starlink + 5G Failover", type: "Backup Bundle" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1500,
    wholesaleLeasePrice: 400,
    wholesalePricingTiers: [
      { minQty: 1, price: 1500, leasePrice: 400 },
      { minQty: 5, price: 1400, leasePrice: 375 },
      { minQty: 10, price: 1300, leasePrice: 350 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 11,
  },
  {
    sku: "RGN-SL-BACKUP",
    name: "RevGen x Starlink Backup",
    description: "Primary 5G IQMC with Starlink backup failover.",
    category: "business",
    imageUrl: "/images/IQMC_Outdoor.png",
    features: ["Starlink Enterprise Hardware", "5G IQMC Hardware", "Automatic Failover"],
    specifications: { connectivity: "5G + Starlink Failover", type: "Backup Bundle" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1500,
    wholesaleLeasePrice: 400,
    wholesalePricingTiers: [
      { minQty: 1, price: 1500, leasePrice: 400 },
      { minQty: 5, price: 1400, leasePrice: 375 },
      { minQty: 10, price: 1300, leasePrice: 350 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 12,
  },

  // ── IoT ──
  {
    sku: "CAM-SL-SINGLE",
    name: "Single Lens Solar Camera",
    description: "Solar-powered PTZ camera with telephoto lens and mobile app control.",
    category: "iot",
    imageUrl: "/images/Camera_White_Solar.png",
    features: ["Telephoto Lens", "PTZ Functionality", "Solar Powered", "Mobile App", "Multiple Color Options"],
    specifications: { lens: "Single Telephoto", power: "Solar", ptz: "Yes" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1400,
    wholesaleLeasePrice: 380,
    wholesalePricingTiers: [
      { minQty: 1, price: 1400, leasePrice: 380 },
      { minQty: 5, price: 1300, leasePrice: 350 },
      { minQty: 10, price: 1200, leasePrice: 320 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 20,
  },
  {
    sku: "CAM-SL-DUAL",
    name: "Dual Lens Solar Camera",
    description: "Solar-powered PTZ camera with wide-angle and telephoto lenses.",
    category: "iot",
    imageUrl: "/images/Camera_Blk_Solar.png",
    features: ["Wide Angle Lens", "Telephoto Lens", "PTZ Functionality", "Solar Powered", "Mobile App"],
    specifications: { lens: "Dual (Wide + Telephoto)", power: "Solar", ptz: "Yes" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1400,
    wholesaleLeasePrice: 380,
    wholesalePricingTiers: [
      { minQty: 1, price: 1400, leasePrice: 380 },
      { minQty: 5, price: 1300, leasePrice: 350 },
      { minQty: 10, price: 1200, leasePrice: 320 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 21,
  },
  {
    sku: "GUARDIAN-GO",
    name: "GuardianGo",
    description: "5G-connected personal safety device with fall detection and GPS tracking.",
    category: "iot",
    imageUrl: "/images/Camo Camera with Solar.png",
    features: ["5G Connectivity", "Fall Detection", "Geofencing", "Breadcrumb Tracking", "Mobile App"],
    specifications: { connectivity: "5G", tracking: "GPS + Breadcrumb", safety: "Fall Detection + Geofencing" } as Record<string, string>,
    retailPrice: 1898,
    retailLeasePrice: 500,
    wholesalePrice: 1400,
    wholesaleLeasePrice: 380,
    wholesalePricingTiers: [
      { minQty: 1, price: 1400, leasePrice: 380 },
      { minQty: 5, price: 1300, leasePrice: 350 },
      { minQty: 10, price: 1200, leasePrice: 320 },
    ],
    wholesaleMinOrderQty: 1,
    isActive: true,
    availableForRetail: true,
    availableForWholesale: true,
    inStock: true,
    supportsDropship: true,
    supportsInventory: false,
    sortOrder: 22,
  },
];

async function seed() {
  console.log("Seeding products...");

  for (const product of seedProducts) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: product.name,
          description: product.description,
          category: product.category,
          imageUrl: product.imageUrl,
          features: product.features,
          specifications: product.specifications,
          retailPrice: product.retailPrice,
          retailLeasePrice: product.retailLeasePrice,
          wholesalePrice: product.wholesalePrice,
          wholesaleLeasePrice: product.wholesaleLeasePrice,
          wholesalePricingTiers: product.wholesalePricingTiers,
          wholesaleMinOrderQty: product.wholesaleMinOrderQty,
          isActive: product.isActive,
          availableForRetail: product.availableForRetail,
          availableForWholesale: product.availableForWholesale,
          inStock: product.inStock,
          supportsDropship: product.supportsDropship,
          supportsInventory: product.supportsInventory,
          sortOrder: product.sortOrder,
          updatedAt: new Date(),
        },
      });
    console.log(`  Upserted: ${product.sku} - ${product.name}`);
  }

  console.log(`Done. ${seedProducts.length} products seeded.`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
