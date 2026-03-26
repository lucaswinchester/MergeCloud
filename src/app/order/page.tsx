"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader2, CreditCard, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { CartProvider, useCart } from "@/app/order/context/CartContext";
import { OrderStepper } from "@/app/order/components/OrderStepper";
import { ProductCatalog } from "@/app/order/components/ProductCatalog";
import { CartSidebar } from "@/app/order/components/CartSidebar";
import { FulfillmentStep } from "@/app/order/components/FulfillmentStep";
import { ShippingForm, type ShippingData } from "@/app/order/components/ShippingForm";
import { WarehouseForm, type WarehouseData } from "@/app/order/components/WarehouseForm";
import { OrderReview } from "@/app/order/components/OrderReview";
import type { FulfillmentType } from "@/types/order";

type Step = "catalog" | "fulfillment" | "shipping" | "review";
const STEP_INDEX: Record<Step, number> = {
  catalog: 0,
  fulfillment: 1,
  shipping: 2,
  review: 3,
};

const emptyShipping: ShippingData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
};

const emptyWarehouse: WarehouseData = {
  contactName: "",
  phone: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
};

function OrderPageContent() {
  const { loading: permLoading } = useOrgPermissions();
  const { items, clearCart } = useCart();

  const [step, setStep] = useState<Step>("catalog");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | null>(null);
  const [shippingData, setShippingData] = useState<ShippingData>(emptyShipping);
  const [warehouseData, setWarehouseData] = useState<WarehouseData>(emptyWarehouse);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validation helpers
  const canProceedFromCatalog = items.length > 0;
  const canProceedFromFulfillment = fulfillmentType !== null;

  const isShippingValid = () => {
    if (fulfillmentType === "dropship") {
      return (
        shippingData.firstName.trim() &&
        shippingData.lastName.trim() &&
        shippingData.email.trim() &&
        shippingData.phone.trim() &&
        shippingData.street1.trim() &&
        shippingData.city.trim() &&
        shippingData.state &&
        shippingData.zipCode.trim()
      );
    }
    return (
      warehouseData.contactName.trim() &&
      warehouseData.phone.trim() &&
      warehouseData.street1.trim() &&
      warehouseData.city.trim() &&
      warehouseData.state &&
      warehouseData.zipCode.trim()
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const lineItems = items.map((item) => {
        const unitPrice =
          item.paymentOption === "lease" && item.product.leasePrice != null
            ? item.product.leasePrice
            : item.product.price;
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice,
          paymentOption: item.paymentOption,
        };
      });

      const orderType = items[0]?.product.category || "residential";

      const body: Record<string, unknown> = {
        orderType,
        lineItems,
        fulfillmentType,
        notes: notes || undefined,
      };

      if (fulfillmentType === "dropship") {
        body.customer = {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          email: shippingData.email,
          phone: shippingData.phone,
          companyName: shippingData.companyName || undefined,
        };
        body.shippingAddress = {
          street1: shippingData.street1,
          street2: shippingData.street2 || undefined,
          city: shippingData.city,
          state: shippingData.state,
          zipCode: shippingData.zipCode,
        };
      } else {
        // Inventory — use warehouse address as shipping, create a placeholder customer
        body.customer = {
          name: warehouseData.contactName,
          email: "",
          phone: warehouseData.phone,
        };
        body.shippingAddress = {
          street1: warehouseData.street1,
          street2: warehouseData.street2 || undefined,
          city: warehouseData.city,
          state: warehouseData.state,
          zipCode: warehouseData.zipCode,
        };
        body.warehouseAddress = {
          contactName: warehouseData.contactName,
          phone: warehouseData.phone,
          street1: warehouseData.street1,
          street2: warehouseData.street2 || undefined,
          city: warehouseData.city,
          state: warehouseData.state,
          zipCode: warehouseData.zipCode,
        };
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit order");
      }

      const result = await res.json();
      toast.success("Order submitted successfully", {
        description: `Order ID: ${result.id}`,
      });

      // Reset
      clearCart();
      setStep("catalog");
      setFulfillmentType(null);
      setShippingData(emptyShipping);
      setWarehouseData(emptyWarehouse);
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  if (permLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/order">Order</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 space-y-6 p-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Order</h2>
          </div>

          <OrderStepper currentStep={STEP_INDEX[step]} />

          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {step === "catalog" && (
                <ProductCatalog />
              )}

              {step === "fulfillment" && (
                <div className="space-y-6">
                  <FulfillmentStep
                    value={fulfillmentType}
                    onChange={setFulfillmentType}
                  />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep("catalog")}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                    </Button>
                    <Button
                      onClick={() => setStep("shipping")}
                      disabled={!canProceedFromFulfillment}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === "shipping" && (
                <div className="space-y-6">
                  {fulfillmentType === "dropship" ? (
                    <ShippingForm
                      data={shippingData}
                      onChange={setShippingData}
                    />
                  ) : (
                    <WarehouseForm
                      data={warehouseData}
                      onChange={setWarehouseData}
                    />
                  )}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep("fulfillment")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={() => setStep("review")}
                      disabled={!isShippingValid()}
                    >
                      Review Order <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="space-y-6">
                  <OrderReview
                    fulfillmentType={fulfillmentType!}
                    shippingData={
                      fulfillmentType === "dropship" ? shippingData : undefined
                    }
                    warehouseData={
                      fulfillmentType === "inventory" ? warehouseData : undefined
                    }
                    notes={notes}
                    onNotesChange={setNotes}
                  />
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setStep("shipping")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Submit Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart sidebar - visible on catalog and fulfillment steps */}
            {(step === "catalog" || step === "fulfillment") && (
              <div className="hidden w-80 shrink-0 lg:block">
                <CartSidebar
                  onProceed={() => {
                    if (canProceedFromCatalog) {
                      setStep("fulfillment");
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function OrderPage() {
  return (
    <CartProvider>
      <OrderPageContent />
    </CartProvider>
  );
}
