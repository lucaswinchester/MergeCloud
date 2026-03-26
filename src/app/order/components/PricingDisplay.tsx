"use client";

import type { CatalogProduct } from "@/types/order";

interface PricingDisplayProps {
  product: CatalogProduct;
  quantity?: number;
}

export function PricingDisplay({ product, quantity = 1 }: PricingDisplayProps) {
  const tiers = product.wholesalePricingTiers;

  if (!tiers?.length) {
    return (
      <div className="space-y-1">
        <div className="text-2xl font-bold">
          ${product.price.toFixed(2)}
        </div>
        {product.leasePrice != null && product.leasePrice > 0 && (
          <div className="text-sm text-muted-foreground">
            or ${product.leasePrice.toFixed(2)}/mo lease
          </div>
        )}
      </div>
    );
  }

  // Wholesale tier table
  return (
    <div className="space-y-2">
      <div className="rounded-md border text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-1.5 text-left font-medium">Qty</th>
              <th className="px-3 py-1.5 text-right font-medium">Price</th>
              {tiers.some((t) => t.leasePrice) && (
                <th className="px-3 py-1.5 text-right font-medium">Lease</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tiers
              .sort((a, b) => a.minQty - b.minQty)
              .map((tier, i) => {
                const isActive =
                  quantity >= tier.minQty &&
                  (i === tiers.length - 1 ||
                    quantity < tiers.sort((a, b) => a.minQty - b.minQty)[i + 1]?.minQty);

                return (
                  <tr
                    key={tier.minQty}
                    className={isActive ? "bg-primary/10 font-semibold" : ""}
                  >
                    <td className="px-3 py-1.5">{tier.minQty}+</td>
                    <td className="px-3 py-1.5 text-right">
                      ${tier.price.toFixed(2)}
                    </td>
                    {tiers.some((t) => t.leasePrice) && (
                      <td className="px-3 py-1.5 text-right">
                        {tier.leasePrice
                          ? `$${tier.leasePrice.toFixed(2)}/mo`
                          : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
