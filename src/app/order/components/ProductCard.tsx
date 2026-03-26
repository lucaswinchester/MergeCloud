"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/order/context/CartContext";
import { PricingDisplay } from "./PricingDisplay";
import type { CatalogProduct } from "@/types/order";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart();
  const minQty = product.wholesaleMinOrderQty ?? 1;
  const [quantity, setQuantity] = useState(minQty);
  const inCart = items.find((i) => i.product.id === product.id);

  const handleAdd = () => {
    addItem(product, quantity);
    setQuantity(minQty);
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{product.name}</CardTitle>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {product.imageUrl && (
          <div className="relative mx-auto h-40 w-40">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="rounded-lg object-contain"
            />
          </div>
        )}

        {product.features?.length ? (
          <ul className="space-y-1 text-sm">
            {product.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto">
          <PricingDisplay product={product} quantity={quantity} />
        </div>

        {!product.inStock ? (
          <Button disabled className="w-full">
            Out of Stock
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min={minQty}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || minQty;
                  setQuantity(Math.max(minQty, v));
                }}
                className="h-8 w-14 border-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button className="flex-1" onClick={handleAdd}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inCart ? "Add More" : "Add to Cart"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
