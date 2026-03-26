"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Shield,
  Users,
  Link,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ResellerCredential {
  id: string;
  clerkUserId: string;
  platform: string;
  platformUserId: string | null;
  platformEmail: string | null;
  syncStatus: string | null;
  metadata: any;
  lastSyncedAt: string | null;
  createdAt: string | null;
  // Enriched from Clerk
  userName?: string;
  userEmail?: string;
}

interface OrgSettings {
  clerkOrgId: string;
  orgName: string;
  hasApiKey: boolean;
  isRetailer: boolean;
  isWholesaler: boolean;
  sparqfiPermissions: Record<string, boolean>;
  lastPermissionSync: string | null;
}

const SPARQFI_PERMISSION_LABELS: Record<string, string> = {
  canActivate: "Activate Devices",
  canDeactivate: "Deactivate Devices",
  canUpdateFirmware: "Update Firmware",
  canPortForward: "Port Forwarding",
  canDedicatedIp: "Dedicated IP",
  canBridgedIp: "Bridged IP",
  canConfigBackup: "Config Backup",
  canViewReports: "View Reports",
};

export default function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();

  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRetailer, setIsRetailer] = useState(false);
  const [isWholesaler, setIsWholesaler] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Reseller credentials state
  const [resellerCreds, setResellerCreds] = useState<ResellerCredential[]>([]);
  const [syncingResellers, setSyncingResellers] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchResellerCredentials();
  }, [orgId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/settings`);
      if (res.ok) {
        const data: OrgSettings = await res.json();
        setSettings(data);
        setIsRetailer(data.isRetailer);
        setIsWholesaler(data.isWholesaler);
        setPermissions(data.sparqfiPermissions ?? {});
      }
    } catch (error) {
      console.error("Failed to fetch org settings:", error);
      toast.error("Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        isRetailer,
        isWholesaler,
        sparqfiPermissions: permissions,
      };
      if (apiKey) {
        body.apiKey = apiKey;
      }

      const res = await fetch(`/api/admin/org/${orgId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
        setApiKey("");
        fetchSettings();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPermissions = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/sync-permissions`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions ?? {});
        toast.success("Permissions synced successfully");
        fetchSettings();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to sync permissions");
      }
    } catch (error) {
      console.error("Failed to sync permissions:", error);
      toast.error("Failed to sync permissions");
    } finally {
      setSyncing(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchResellerCredentials = async () => {
    setLoadingCreds(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/reseller-credentials`);
      if (res.ok) {
        const data = await res.json();
        setResellerCreds(data.credentials ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch reseller credentials:", error);
    } finally {
      setLoadingCreds(false);
    }
  };

  const handleSyncResellers = async () => {
    setSyncingResellers(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/sync-resellers`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        const matchCount = data.matched?.length ?? 0;
        const unmatchCount = data.unmatched?.length ?? 0;
        const revokedCount = data.revoked?.length ?? 0;
        toast.success(
          `Sync complete: ${matchCount} matched, ${unmatchCount} unmatched, ${revokedCount} revoked`
        );
        fetchResellerCredentials();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to sync resellers");
      }
    } catch (error) {
      console.error("Failed to sync resellers:", error);
      toast.error("Failed to sync resellers");
    } finally {
      setSyncingResellers(false);
    }
  };

  const handleRevokeCredential = async (credentialId: string) => {
    try {
      const res = await fetch(
        `/api/admin/org/${orgId}/reseller-credentials/${credentialId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("Credential revoked");
        fetchResellerCredentials();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to revoke credential");
      }
    } catch (error) {
      console.error("Failed to revoke credential:", error);
      toast.error("Failed to revoke credential");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {settings?.orgName ?? "Organization Settings"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure API access and permissions
          </p>
        </div>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SparqFi API Key
          </CardTitle>
          <CardDescription>
            The encrypted API key used to authenticate with the SparqFi API for
            this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {settings?.hasApiKey ? (
              <Badge className="bg-green-500/10 text-green-500">Configured</Badge>
            ) : (
              <Badge variant="destructive">Not Set</Badge>
            )}
            {settings?.lastPermissionSync && (
              <span className="text-muted-foreground text-xs">
                Last synced:{" "}
                {new Date(settings.lastPermissionSync).toLocaleString()}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {settings?.hasApiKey ? "Replace API Key" : "Set API Key"}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    settings?.hasApiKey
                      ? "Enter new key to replace..."
                      : "Enter SparqFi API key..."
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Type */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Type</CardTitle>
          <CardDescription>
            Controls which sections are visible in the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRetailer"
              checked={isRetailer}
              onCheckedChange={(checked) => setIsRetailer(checked === true)}
            />
            <Label htmlFor="isRetailer" className="cursor-pointer">
              Retailer
              <span className="text-muted-foreground ml-2 text-sm">
                (Order + Customers tabs)
              </span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isWholesaler"
              checked={isWholesaler}
              onCheckedChange={(checked) => setIsWholesaler(checked === true)}
            />
            <Label htmlFor="isWholesaler" className="cursor-pointer">
              Wholesaler
              <span className="text-muted-foreground ml-2 text-sm">
                (Devices tab)
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* SparqFi Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SparqFi Permissions
              </CardTitle>
              <CardDescription>
                Feature-level permissions synced from SparqFi. Override toggles
                below.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncPermissions}
              disabled={syncing || !settings?.hasApiKey}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              Sync Permissions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(SPARQFI_PERMISSION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={permissions[key] ?? false}
                  onCheckedChange={() => togglePermission(key)}
                />
                <Label htmlFor={key} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reseller Credential Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reseller Credential Mapping
              </CardTitle>
              <CardDescription>
                Map Clerk users to their SparqFi sub-reseller accounts for
                per-user device scoping. Non-admin users only see devices under
                their assigned reseller.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncResellers}
              disabled={syncingResellers || !settings?.hasApiKey}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncingResellers ? "animate-spin" : ""}`}
              />
              Sync Resellers
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCreds ? (
            <p className="text-muted-foreground text-sm">Loading credentials...</p>
          ) : resellerCreds.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No reseller credentials mapped yet. Click &quot;Sync Resellers&quot; to
              auto-match SparqFi sub-resellers to organization members by email.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-muted-foreground pb-2 text-left font-medium">
                      Clerk User
                    </th>
                    <th className="text-muted-foreground pb-2 text-left font-medium">
                      Platform Email
                    </th>
                    <th className="text-muted-foreground pb-2 text-left font-medium">
                      Reseller UUID
                    </th>
                    <th className="text-muted-foreground pb-2 text-left font-medium">
                      Status
                    </th>
                    <th className="text-muted-foreground pb-2 text-left font-medium">
                      Last Synced
                    </th>
                    <th className="text-muted-foreground pb-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resellerCreds.map((cred) => (
                    <tr key={cred.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Link className="text-muted-foreground h-3 w-3" />
                          <span className="font-mono text-xs">
                            {cred.clerkUserId.slice(0, 12)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-2">
                        {cred.platformEmail ?? "—"}
                      </td>
                      <td className="py-2">
                        <span className="font-mono text-xs">
                          {cred.platformUserId
                            ? `${cred.platformUserId.slice(0, 8)}...`
                            : "—"}
                        </span>
                      </td>
                      <td className="py-2">
                        {cred.syncStatus === "matched" && (
                          <Badge className="bg-green-500/10 text-green-500">
                            Matched
                          </Badge>
                        )}
                        {cred.syncStatus === "manual" && (
                          <Badge className="bg-blue-500/10 text-blue-500">
                            Manual
                          </Badge>
                        )}
                        {cred.syncStatus === "revoked" && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                        {!["matched", "manual", "revoked"].includes(
                          cred.syncStatus ?? ""
                        ) && (
                          <Badge variant="secondary">
                            {cred.syncStatus ?? "Unknown"}
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted-foreground py-2 text-xs">
                        {cred.lastSyncedAt
                          ? new Date(cred.lastSyncedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        {cred.syncStatus !== "revoked" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRevokeCredential(cred.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
