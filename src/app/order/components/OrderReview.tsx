"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/app/order/context/CartContext";
import type { FulfillmentType } from "@/types/order";
import type { ShippingData } from "./ShippingForm";
import type { WarehouseData } from "./WarehouseForm";

interface OrderReviewProps {
  fulfillmentType: FulfillmentType;
  shippingData?: ShippingData;
  warehouseData?: WarehouseData;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const TAX_RATE = 0.0825;

export function OrderReview({
  fulfillmentType,
  shippingData,
  warehouseData,
  notes,
  onNotesChange,
}: OrderReviewProps) {
  const { items, subtotal } = useCart();
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review Your Order</h3>
        <p className="text-sm text-muted-foreground">
          Please verify all details before submitting.
        </p>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {items.map((item) => {
              const unitPrice =
                item.paymentOption === "lease" && item.product.leasePrice != null
                  ? item.product.leasePrice
                  : item.product.price;

              return (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 py-3"
                >
                  {item.product.imageUrl && (
                    <div className="relative h-12 w-12 shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="rounded object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x ${unitPrice.toFixed(2)}
                      {item.paymentOption === "lease" ? "/mo" : ""}
                    </p>
                  </div>
                  <span className="font-medium">
                    ${(unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator className="my-3" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8.25%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Fulfillment
            <Badge variant="outline" className="capitalize">
              {fulfillmentType === "dropship"
                ? "Ship to Customer"
                : "Ship to Warehouse"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {fulfillmentType === "dropship" && shippingData && (
            <div>
              <p className="font-medium">
                {shippingData.firstName} {shippingData.lastName}
              </p>
              <p className="text-muted-foreground">{shippingData.email}</p>
              <p className="text-muted-foreground">{shippingData.phone}</p>
              {shippingData.companyName && (
                <p className="text-muted-foreground">
                  {shippingData.companyName}
                </p>
              )}
              <p className="mt-2">{shippingData.street1}</p>
              {shippingData.street2 && <p>{shippingData.street2}</p>}
              <p>
                {shippingData.city}, {shippingData.state}{" "}
                {shippingData.zipCode}
              </p>
            </div>
          )}
          {fulfillmentType === "inventory" && warehouseData && (
            <div>
              <p className="font-medium">{warehouseData.contactName}</p>
              <p className="text-muted-foreground">{warehouseData.phone}</p>
              <p className="mt-2">{warehouseData.street1}</p>
              {warehouseData.street2 && <p>{warehouseData.street2}</p>}
              <p>
                {warehouseData.city}, {warehouseData.state}{" "}
                {warehouseData.zipCode}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Order Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Special instructions or notes..."
          rows={3}
        />
      </div>
    </div>
  );
}
