"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Building2, Key, RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrgWithSettings {
  id: string;
  name: string;
  membersCount: number;
  hasApiKey: boolean;
  isRetailer: boolean;
  isWholesaler: boolean;
}

export default function AdminDashboard() {
  const [orgs, setOrgs] = useState<OrgWithSettings[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orgs");
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.organizations ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <p className="text-muted-foreground text-sm">
              Manage organization settings and permissions
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrgs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/products">
          <Card className="hover:border-primary/50 cursor-pointer transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="text-muted-foreground h-5 w-5" />
                <CardTitle className="text-base">Product Catalog</CardTitle>
              </div>
              <CardDescription>
                Manage products, pricing, and availability
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground py-12 text-center">
          Loading organizations...
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No organizations found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Link key={org.id} href={`/admin/org/${org.id}`}>
              <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground h-5 w-5" />
                      <CardTitle className="text-base">{org.name}</CardTitle>
                    </div>
                    {org.hasApiKey ? (
                      <Key className="h-4 w-4 text-green-500" />
                    ) : (
                      <Key className="text-muted-foreground h-4 w-4" />
                    )}
                  </div>
                  <CardDescription>
                    {org.membersCount} member{org.membersCount !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {org.isRetailer && (
                      <Badge variant="secondary">Retailer</Badge>
                    )}
                    {org.isWholesaler && (
                      <Badge variant="secondary">Wholesaler</Badge>
                    )}
                    {!org.hasApiKey && (
                      <Badge variant="destructive">No API Key</Badge>
                    )}
                    {!org.isRetailer && !org.isWholesaler && org.hasApiKey && (
                      <Badge variant="outline">No type set</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
