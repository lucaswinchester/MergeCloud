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
import { Warehouse } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export interface WarehouseData {
  contactName: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
}

interface WarehouseFormProps {
  data: WarehouseData;
  onChange: (data: WarehouseData) => void;
}

export function WarehouseForm({ data, onChange }: WarehouseFormProps) {
  const update = (field: keyof WarehouseData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Warehouse / Delivery Address</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Name *</Label>
          <Input
            value={data.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            placeholder="Receiving Dept"
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
        <Label>Street Address *</Label>
        <Input
          value={data.street1}
          onChange={(e) => update("street1", e.target.value)}
          placeholder="1000 Industrial Blvd"
        />
      </div>
      <div className="space-y-2">
        <Label>Suite / Dock / Unit</Label>
        <Input
          value={data.street2}
          onChange={(e) => update("street2", e.target.value)}
          placeholder="Dock 5"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>City *</Label>
          <Input
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="Dallas"
          />
        </div>
        <div className="space-y-2">
          <Label>State *</Label>
          <Select value={data.state} onValueChange={(v) => update("state", v)}>
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
            placeholder="75201"
          />
        </div>
      </div>
    </div>
  );
}
