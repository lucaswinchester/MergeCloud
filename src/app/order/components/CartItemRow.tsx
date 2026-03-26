"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/app/order/context/CartContext";
import type { CartItem } from "@/types/order";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const minQty = item.product.wholesaleMinOrderQty ?? 1;

  const unitPrice =
    item.paymentOption === "lease" && item.product.leasePrice != null
      ? item.product.leasePrice
      : item.product.price;

  return (
    <div className="flex items-start gap-3 py-3">
      {item.product.imageUrl && (
        <div className="relative h-10 w-10 shrink-0">
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="rounded object-contain"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product.name}</p>
        <p className="text-xs text-muted-foreground">
          ${unitPrice.toFixed(2)}
          {item.paymentOption === "lease" ? "/mo" : ""} each
        </p>
        <div className="mt-1 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateQuantity(item.product.id, Math.max(minQty, item.quantity - 1))
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min={minQty}
            value={item.quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value) || minQty;
              updateQuantity(item.product.id, Math.max(minQty, v));
            }}
            className="h-6 w-12 border-0 p-0 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-medium">
          ${(unitPrice * item.quantity).toFixed(2)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={() => removeItem(item.product.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
