"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { CatalogProduct, CartItem } from "@/types/order";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: CatalogProduct, qty?: number, paymentOption?: "purchase" | "lease") => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePaymentOption: (productId: string, option: "purchase" | "lease") => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (product: CatalogProduct, qty = 1, paymentOption: "purchase" | "lease" = "purchase") => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        return [...prev, { product, quantity: qty, paymentOption }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  const updatePaymentOption = useCallback(
    (productId: string, option: "purchase" | "lease") => {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, paymentOption: option } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice =
          item.paymentOption === "lease" && item.product.leasePrice != null
            ? item.product.leasePrice
            : item.product.price;

        // Apply wholesale tier pricing if available
        if (item.product.wholesalePricingTiers?.length) {
          const tiers = [...item.product.wholesalePricingTiers].sort(
            (a, b) => b.minQty - a.minQty
          );
          const matched = tiers.find((t) => item.quantity >= t.minQty);
          if (matched) {
            const tierPrice =
              item.paymentOption === "lease" && matched.leasePrice
                ? matched.leasePrice
                : matched.price;
            return sum + tierPrice * item.quantity;
          }
        }

        return sum + unitPrice * item.quantity;
      }, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updatePaymentOption,
      clearCart,
      subtotal,
      itemCount,
    }),
    [items, addItem, removeItem, updateQuantity, updatePaymentOption, clearCart, subtotal, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
