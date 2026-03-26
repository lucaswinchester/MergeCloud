"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, Truck } from "lucide-react";
import type { FulfillmentType } from "@/types/order";

interface FulfillmentStepProps {
  value: FulfillmentType | null;
  onChange: (type: FulfillmentType) => void;
}

const OPTIONS: {
  type: FulfillmentType;
  icon: typeof Warehouse;
  title: string;
  description: string;
}[] = [
  {
    type: "dropship",
    icon: Truck,
    title: "Ship to Customer",
    description:
      "We ship directly to your customer. You provide the customer's name and shipping address.",
  },
  {
    type: "inventory",
    icon: Warehouse,
    title: "Ship to My Warehouse",
    description:
      "We ship to your warehouse or business address. You handle last-mile delivery to your customer.",
  },
];

export function FulfillmentStep({ value, onChange }: FulfillmentStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Choose Fulfillment Method</h3>
        <p className="text-sm text-muted-foreground">
          How would you like your order fulfilled?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(({ type, icon: Icon, title, description }) => {
          const isSelected = value === type;
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:border-primary/30"
              }`}
              onClick={() => onChange(type)}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <Icon
                  className={`h-10 w-10 ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
