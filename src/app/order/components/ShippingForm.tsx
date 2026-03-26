"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, MapPin } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export interface ShippingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ShippingFormProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
}

export function ShippingForm({ data, onChange }: ShippingFormProps) {
  const update = (field: keyof ShippingData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Customer Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name *</Label>
            <Input
              value={data.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name *</Label>
            <Input
              value={data.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              type="tel"
              value={data.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Company Name (optional)</Label>
          <Input
            value={data.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Shipping Address</h3>
        </div>
        <div className="space-y-2">
          <Label>Street Address *</Label>
          <Input
            value={data.street1}
            onChange={(e) => update("street1", e.target.value)}
            placeholder="123 Main Street"
          />
        </div>
        <div className="space-y-2">
          <Label>Apt / Suite / Unit</Label>
          <Input
            value={data.street2}
            onChange={(e) => update("street2", e.target.value)}
            placeholder="Apt 4B"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>City *</Label>
            <Input
              value={data.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="New York"
            />
          </div>
          <div className="space-y-2">
            <Label>State *</Label>
            <Select
              value={data.state}
              onValueChange={(v) => update("state", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ZIP Code *</Label>
            <Input
              value={data.zipCode}
              onChange={(e) => update("zipCode", e.target.value)}
              placeholder="10001"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
