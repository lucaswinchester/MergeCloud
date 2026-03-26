"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/order/context/CartContext";
import { CartItemRow } from "./CartItemRow";

interface CartSidebarProps {
  onProceed: () => void;
}

export function CartSidebar({ onProceed }: CartSidebarProps) {
  const { items, subtotal, itemCount, clearCart } = useCart();

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="h-4 w-4" />
          Cart ({itemCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Your cart is empty
          </p>
        ) : (
          <>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={clearCart}
              >
                Clear
              </Button>
              <Button size="sm" className="flex-1" onClick={onProceed}>
                Proceed
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
