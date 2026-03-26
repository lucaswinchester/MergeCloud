"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Shield, ShieldOff, Upload, Download, HardDrive, Wifi } from "lucide-react";
import { toast } from "sonner";
import { InfoRow } from "./InfoRow";
import { toTitle } from "./device-utils";
import { DeviceTabProps } from "@/types/device";
import {
  activateDevice,
  deactivateDevice,
  updateFirmware,
  removeScheduleRestart,
} from "@/server/iqapi";
import {
  getDeviceConfig,
  setDeviceConfig,
  resetToFactoryDefaults,
  setLanIP,
} from "@/server/device-config";
import {
  createConfigBackup,
  listConfigBackups,
  uploadConfigBackup,
  reapplyConfig,
  getPFRulesBackup,
  uploadPFRulesBackup,
  restorePFRules,
} from "@/server/config-backup";
import { activateGSMPort, activateM1ICCID } from "@/server/gsm-sim";

export function DeviceSettingsTab({ device, uuid, actionLoading, setActionLoading, triggerBoostMode, sparqfiPermissions }: DeviceTabProps) {
  const canActivate = sparqfiPermissions?.canActivate !== false;
  const canDeactivate = sparqfiPermissions?.canDeactivate !== false;
  const canUpdateFirmware = sparqfiPermissions?.canUpdateFirmware !== false;
  const canConfigBackup = sparqfiPermissions?.canConfigBackup !== false;
  // Config state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_deviceConfig, setDeviceConfigState] = useState<unknown>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configSsid, setConfigSsid] = useState("");
  const [configPassword, setConfigPassword] = useState("");
  const [configLogo, setConfigLogo] = useState<File | null>(null);

  // LAN IP
  const [lanDialogOpen, setLanDialogOpen] = useState(false);
  const [lanIpDraft, setLanIpDraft] = useState("");

  // Confirmation dialogs
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [factoryResetDialogOpen, setFactoryResetDialogOpen] = useState(false);

  // Config backups
  const [backups, setBackups] = useState<Record<string, unknown>[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [pfRulesFile, setPfRulesFile] = useState<File | null>(null);

  const loadBackups = useCallback(async () => {
    setBackupsLoading(true);
    try {
      const data = await listConfigBackups(uuid);
      setBackups(Array.isArray(data) ? data : data?.items ?? []);
    } catch {
      // Silently fail for non-critical data
    }
    setBackupsLoading(false);
  }, [uuid]);

  // Load backups on mount
  useEffect(() => {
    loadBackups();
  }, [uuid, loadBackups]);

  // Activate / Deactivate
  const handleActivate = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await activateDevice(uuid, device.port.id_portgroup);
      toast.success("Device activation initiated");
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to activate device", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await deactivateDevice(uuid);
      toast.success("Device deactivation initiated");
      setDeactivateDialogOpen(false);
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to deactivate device", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFirmware = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await updateFirmware(uuid);
      toast.success("Firmware update initiated");
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to update firmware", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveScheduleRestart = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await removeScheduleRestart(uuid);
      toast.success("Scheduled restart removed");
    } catch (e: unknown) {
      toast.error("Failed to remove scheduled restart", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Config operations
  const handleLoadConfig = async () => {
    setConfigLoading(true);
    try {
      const config = await getDeviceConfig(uuid);
      setDeviceConfigState(config);
      setConfigSsid(config?.ssid || "");
      setConfigPassword("");
      setConfigDialogOpen(true);
    } catch (e: unknown) {
      toast.error("Failed to load config", { description: e instanceof Error ? e.message : "Unknown error" });
    }
    setConfigLoading(false);
  };

  const handleSaveConfig = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await setDeviceConfig(uuid, {
        ssid: configSsid,
        password: configPassword || undefined,
        logo_file: configLogo || undefined,
      });
      toast.success("Device configuration updated");
      setConfigDialogOpen(false);
    } catch (e: unknown) {
      toast.error("Failed to update config", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFactoryReset = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await resetToFactoryDefaults(uuid);
      toast.success("Factory reset initiated");
      setFactoryResetDialogOpen(false);
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to factory reset", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetLanIP = async () => {
    if (actionLoading || !lanIpDraft.trim()) return;
    try {
      setActionLoading(true);
      await setLanIP(uuid, { lan_ip: lanIpDraft.trim() });
      toast.success("LAN IP updated", { description: lanIpDraft.trim() });
      setLanDialogOpen(false);
      setLanIpDraft("");
    } catch (e: unknown) {
      toast.error("Failed to set LAN IP", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Backup operations
  const handleCreateBackup = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await createConfigBackup(uuid);
      toast.success("Configuration backup created");
      loadBackups();
    } catch (e: unknown) {
      toast.error("Failed to create backup", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadBackup = async () => {
    if (actionLoading || !backupFile) return;
    try {
      setActionLoading(true);
      await uploadConfigBackup(uuid, backupFile);
      toast.success("Backup uploaded successfully");
      setUploadDialogOpen(false);
      setBackupFile(null);
      loadBackups();
    } catch (e: unknown) {
      toast.error("Failed to upload backup", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReapplyConfig = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await reapplyConfig(uuid);
      toast.success("Configuration reapplied");
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to reapply config", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPFRules = async () => {
    try {
      const data = await getPFRulesBackup(uuid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pf-rules-${uuid}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast.error("Failed to download PF rules", { description: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  const handleUploadPFRules = async () => {
    if (!pfRulesFile) return;
    try {
      setActionLoading(true);
      await uploadPFRulesBackup(uuid, pfRulesFile);
      toast.success("PF rules backup uploaded");
      setPfRulesFile(null);
    } catch (e: unknown) {
      toast.error("Failed to upload PF rules", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestorePFRules = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const data = await getPFRulesBackup(uuid);
      await restorePFRules(uuid, data);
      toast.success("PF rules restored from backup");
    } catch (e: unknown) {
      toast.error("Failed to restore PF rules", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // GSM / SIM
  const handleActivateGSM = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await activateGSMPort(uuid);
      toast.success("GSM port activation initiated");
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to activate GSM port", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateM1ICCID = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await activateM1ICCID(uuid);
      toast.success("M1 ICCID activation initiated");
      triggerBoostMode();
    } catch (e: unknown) {
      toast.error("Failed to activate M1 ICCID", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* System Information */}
      <div className="space-y-1.5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">
          System Information
        </h2>
        <div className="grid gap-2">
          <div className="flex items-center py-4">
            <span className="text-sm text-muted-foreground pr-8 min-w-32">App Version</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{toTitle(device.device.app_version, "Unknown")}</span>
              {canUpdateFirmware && device.device.updatestatus !== 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleUpdateFirmware}
                  disabled={actionLoading}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update Firmware
                </Button>
              )}
            </div>
          </div>
          <InfoRow
            label="Update Status"
            value={device.device.updatestatus === 0 ? "Up to date" : "Update available"}
          />
          <div className="flex items-center py-4">
            <span className="text-sm text-muted-foreground pr-8 min-w-32">Admin Link</span>
            {device.device.admin_link ? (
              <a
                href={device.device.admin_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {device.device.admin_link}
              </a>
            ) : (
              <span className="text-sm">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* Database Information */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Database Information</h2>
        <div className="space-y-4">
          <InfoRow label="Reseller" value={toTitle(device.db_info.reseller_name, "N/A")} />
          <InfoRow label="Parent Reseller" value={toTitle(device.db_info.parent_reseller_name, "N/A")} />
        </div>
      </div>

      {/* Activation / Deactivation */}
      {(canActivate || canDeactivate) && (
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">Device Activation</h2>
          <div className="flex items-center gap-3">
            {device.db_info.is_activated ? (
              canDeactivate && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Deactivate Device
                </Button>
              )
            ) : (
              canActivate && (
                <Button size="sm" onClick={handleActivate} disabled={actionLoading}>
                  <Shield className="h-4 w-4 mr-2" />
                  Activate Device
                </Button>
              )
            )}
            {device.db_info.scheduled_restart_frequency && (
              <Button variant="outline" size="sm" onClick={handleRemoveScheduleRestart} disabled={actionLoading}>
                Remove Scheduled Restart
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to deactivate this device? This will disconnect the device from the network.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={actionLoading}>
              {actionLoading ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Configuration */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">Device Configuration</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleLoadConfig} disabled={configLoading}>
            {configLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
            View / Edit Config
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLanDialogOpen(true)}>
            Set LAN IP
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setFactoryResetDialogOpen(true)} disabled={actionLoading}>
            Factory Reset
          </Button>
        </div>
      </div>

      {/* Config edit dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>SSID</Label>
              <Input value={configSsid} onChange={(e) => setConfigSsid(e.target.value)} placeholder="Network name" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={configPassword} onChange={(e) => setConfigPassword(e.target.value)} placeholder="Leave blank to keep current" />
            </div>
            <div className="space-y-2">
              <Label>Logo File (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setConfigLogo(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveConfig} disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Config"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LAN IP dialog */}
      <Dialog open={lanDialogOpen} onOpenChange={setLanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set LAN IP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>LAN IP Address</Label>
              <Input
                value={lanIpDraft}
                onChange={(e) => setLanIpDraft(e.target.value)}
                placeholder="e.g. 192.168.1.1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLanDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSetLanIP} disabled={actionLoading || !lanIpDraft.trim()}>
                {actionLoading ? "Setting..." : "Set LAN IP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Factory Reset confirmation */}
      <Dialog open={factoryResetDialogOpen} onOpenChange={setFactoryResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Factory Reset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to factory reset this device? This will restore all settings to their defaults.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFactoryResetDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFactoryReset} disabled={actionLoading}>
              {actionLoading ? "Resetting..." : "Factory Reset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GSM / SIM Activation */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">GSM / SIM</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleActivateGSM} disabled={actionLoading}>
            Activate GSM Port
          </Button>
          {device.device.dev_m1iccid && (
            <Button variant="outline" size="sm" onClick={handleActivateM1ICCID} disabled={actionLoading}>
              Activate M1 ICCID
            </Button>
          )}
        </div>
      </div>

      {/* Configuration Backups */}
      {canConfigBackup && <div className="space-y-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">Configuration Backups</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCreateBackup} disabled={actionLoading}>
            <HardDrive className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
          <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Backup
          </Button>
          <Button variant="outline" size="sm" onClick={handleReapplyConfig} disabled={actionLoading}>
            Reapply Config
          </Button>
        </div>

        {backupsLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading backups...</span>
          </div>
        ) : backups.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b, i) => (
                <TableRow key={(b.id as string) ?? i}>
                  <TableCell>{(b.name as string) || `Backup ${i + 1}`}</TableCell>
                  <TableCell>{b.created_at ? new Date(b.created_at as string).toLocaleString() : "N/A"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No backups available</p>
        )}

        {/* PF Rules subsection */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium text-foreground/80">Port Forwarding Rules Backup</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownloadPFRules}>
              <Download className="h-4 w-4 mr-2" />
              Download PF Rules
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".json"
                className="w-48 h-8 text-xs"
                onChange={(e) => setPfRulesFile(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" size="sm" onClick={handleUploadPFRules} disabled={!pfRulesFile || actionLoading}>
                Upload
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestorePFRules} disabled={actionLoading}>
              Restore from Backup
            </Button>
          </div>
        </div>
      </div>}

      {/* Upload Backup dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Configuration Backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Backup File</Label>
              <Input type="file" onChange={(e) => setBackupFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadBackup} disabled={!backupFile || actionLoading}>
                {actionLoading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
