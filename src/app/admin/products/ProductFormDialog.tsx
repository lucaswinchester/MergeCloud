"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PricingTier {
  minQty: number;
  price: number;
  leasePrice?: number;
}

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  features: string[];
  retailPrice: number;
  retailLeasePrice: number;
  wholesalePrice: number;
  wholesaleLeasePrice: number;
  wholesalePricingTiers: PricingTier[];
  wholesaleMinOrderQty: number;
  isActive: boolean;
  availableForRetail: boolean;
  availableForWholesale: boolean;
  inStock: boolean;
  supportsDropship: boolean;
  supportsInventory: boolean;
  beQuickProductId: string;
  sortOrder: number;
}

const emptyForm: ProductFormData = {
  sku: "",
  name: "",
  description: "",
  category: "residential",
  imageUrl: "",
  features: [""],
  retailPrice: 0,
  retailLeasePrice: 0,
  wholesalePrice: 0,
  wholesaleLeasePrice: 0,
  wholesalePricingTiers: [{ minQty: 1, price: 0 }],
  wholesaleMinOrderQty: 1,
  isActive: true,
  availableForRetail: true,
  availableForWholesale: false,
  inStock: true,
  supportsDropship: true,
  supportsInventory: false,
  beQuickProductId: "",
  sortOrder: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductRecord = Record<string, any>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductRecord | null;
  onSaved: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        category: product.category || "residential",
        imageUrl: product.imageUrl || "",
        features: product.features?.length ? product.features : [""],
        retailPrice: product.retailPrice ?? 0,
        retailLeasePrice: product.retailLeasePrice ?? 0,
        wholesalePrice: product.wholesalePrice ?? 0,
        wholesaleLeasePrice: product.wholesaleLeasePrice ?? 0,
        wholesalePricingTiers: product.wholesalePricingTiers?.length
          ? product.wholesalePricingTiers
          : [{ minQty: 1, price: 0 }],
        wholesaleMinOrderQty: product.wholesaleMinOrderQty ?? 1,
        isActive: product.isActive ?? true,
        availableForRetail: product.availableForRetail ?? true,
        availableForWholesale: product.availableForWholesale ?? false,
        inStock: product.inStock ?? true,
        supportsDropship: product.supportsDropship ?? true,
        supportsInventory: product.supportsInventory ?? false,
        beQuickProductId: product.beQuickProductId || "",
        sortOrder: product.sortOrder ?? 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  const update = (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.sku || !form.name || !form.category) {
      toast.error("SKU, Name, and Category are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.filter((f) => f.trim()),
        beQuickProductId: form.beQuickProductId || null,
      };

      const url = isEditing
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Product — ${product.sku}` : "Add Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Basic Info
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => update("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="iot">IoT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="/images/product.png"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    update("sortOrder", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Features */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Features
            </h3>
            {form.features.map((feat, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={feat}
                  onChange={(e) => {
                    const next = [...form.features];
                    next[i] = e.target.value;
                    update("features", next);
                  }}
                  placeholder={`Feature ${i + 1}`}
                />
                {form.features.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      update(
                        "features",
                        form.features.filter((_, j) => j !== i)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => update("features", [...form.features, ""])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Feature
            </Button>
          </section>

          <Separator />

          {/* Retail Pricing */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Retail Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.retailPrice}
                  onChange={(e) =>
                    update("retailPrice", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Lease Price (/mo)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.retailLeasePrice}
                  onChange={(e) =>
                    update("retailLeasePrice", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Wholesale Pricing */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Wholesale Pricing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Base Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.wholesalePrice}
                  onChange={(e) =>
                    update("wholesalePrice", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Lease Price (/mo)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.wholesaleLeasePrice}
                  onChange={(e) =>
                    update(
                      "wholesaleLeasePrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order Qty</Label>
                <Input
                  type="number"
                  value={form.wholesaleMinOrderQty}
                  onChange={(e) =>
                    update(
                      "wholesaleMinOrderQty",
                      parseInt(e.target.value) || 1
                    )
                  }
                />
              </div>
            </div>

            <Label className="block mt-4">Pricing Tiers</Label>
            <div className="space-y-2">
              {form.wholesalePricingTiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Qty</Label>
                    <Input
                      type="number"
                      value={tier.minQty}
                      onChange={(e) => {
                        const next = [...form.wholesalePricingTiers];
                        next[i] = {
                          ...next[i],
                          minQty: parseInt(e.target.value) || 1,
                        };
                        update("wholesalePricingTiers", next);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => {
                        const next = [...form.wholesalePricingTiers];
                        next[i] = {
                          ...next[i],
                          price: parseFloat(e.target.value) || 0,
                        };
                        update("wholesalePricingTiers", next);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lease (opt)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tier.leasePrice ?? ""}
                      onChange={(e) => {
                        const next = [...form.wholesalePricingTiers];
                        const val = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        next[i] = { ...next[i], leasePrice: val };
                        update("wholesalePricingTiers", next);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={form.wholesalePricingTiers.length <= 1}
                    onClick={() =>
                      update(
                        "wholesalePricingTiers",
                        form.wholesalePricingTiers.filter((_, j) => j !== i)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                update("wholesalePricingTiers", [
                  ...form.wholesalePricingTiers,
                  { minQty: 1, price: 0 },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add Tier
            </Button>
          </section>

          <Separator />

          {/* Availability & Fulfillment */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Availability & Fulfillment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => update("isActive", !!v)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="inStock"
                  checked={form.inStock}
                  onCheckedChange={(v) => update("inStock", !!v)}
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="availableForRetail"
                  checked={form.availableForRetail}
                  onCheckedChange={(v) => update("availableForRetail", !!v)}
                />
                <Label htmlFor="availableForRetail">Available for Retail</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="availableForWholesale"
                  checked={form.availableForWholesale}
                  onCheckedChange={(v) => update("availableForWholesale", !!v)}
                />
                <Label htmlFor="availableForWholesale">
                  Available for Wholesale
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="supportsDropship"
                  checked={form.supportsDropship}
                  onCheckedChange={(v) => update("supportsDropship", !!v)}
                />
                <Label htmlFor="supportsDropship">Supports Dropship</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="supportsInventory"
                  checked={form.supportsInventory}
                  onCheckedChange={(v) => update("supportsInventory", !!v)}
                />
                <Label htmlFor="supportsInventory">Supports Inventory</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>BeQuick Product ID (optional)</Label>
              <Input
                value={form.beQuickProductId}
                onChange={(e) => update("beQuickProductId", e.target.value)}
                placeholder="BQ-12345"
              />
            </div>
          </section>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
