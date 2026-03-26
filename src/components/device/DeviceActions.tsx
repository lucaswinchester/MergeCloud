"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DeviceTabProps } from "@/types/device";
import { scheduleDeviceRestart, updateDeviceSSID, updateDeviceMTU } from "@/server/iqapi";

interface DeviceActionsProps extends DeviceTabProps {
  scheduleDialogOpen: boolean;
  setScheduleDialogOpen: (v: boolean) => void;
  ssidDialogOpen: boolean;
  setSSIDDialogOpen: (v: boolean) => void;
  mtuDialogOpen: boolean;
  setMTUDialogOpen: (v: boolean) => void;
}

export function DeviceActions({
  uuid,
  actionLoading,
  setActionLoading,
  scheduleDialogOpen,
  setScheduleDialogOpen,
  ssidDialogOpen,
  setSSIDDialogOpen,
  mtuDialogOpen,
  setMTUDialogOpen,
}: DeviceActionsProps) {
  const [ssidDraft, setSSIDDraft] = useState("");
  const [ssidPassword, setSSIDPassword] = useState("");
  const [mtuDraft, setMTUDraft] = useState("1500");
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [scheduleTime, setScheduleTime] = useState("02:00");

  const handleUpdateSSID = async () => {
    if (!uuid || actionLoading || !ssidDraft.trim()) return;
    try {
      setActionLoading(true);
      await updateDeviceSSID(uuid, {
        ssid: ssidDraft.trim(),
        password: ssidPassword || undefined,
      });
      toast.success("SSID update initiated", {
        description: `SSID will be changed to "${ssidDraft.trim()}"`,
      });
      setSSIDDialogOpen(false);
      setSSIDDraft("");
      setSSIDPassword("");
    } catch (e: unknown) {
      toast.error("Failed to update SSID", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMTU = async () => {
    if (!uuid || actionLoading) return;
    const mtuValue = parseInt(mtuDraft, 10);
    if (isNaN(mtuValue) || mtuValue < 68 || mtuValue > 9000) {
      toast.error("Invalid MTU value", { description: "MTU must be between 68 and 9000" });
      return;
    }
    try {
      setActionLoading(true);
      await updateDeviceMTU(uuid, { mtu: mtuValue });
      toast.success("MTU update initiated", { description: `MTU will be changed to ${mtuValue}` });
      setMTUDialogOpen(false);
      setMTUDraft("1500");
    } catch (e: unknown) {
      toast.error("Failed to update MTU", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleRestart = async () => {
    try {
      setActionLoading(true);
      await scheduleDeviceRestart(uuid, {
        frequency: scheduleFrequency,
        time: scheduleTime,
        day: scheduleFrequency === "weekly" ? 0 : undefined,
      });
      toast.success("Device restart scheduled", {
        description: `Restart scheduled ${scheduleFrequency} at ${scheduleTime}`,
      });
      setScheduleDialogOpen(false);
    } catch (e: unknown) {
      toast.error("Failed to schedule restart", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Schedule Restart Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Device Restart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleScheduleRestart} disabled={actionLoading}>
                {actionLoading ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update SSID Dialog */}
      <Dialog open={ssidDialogOpen} onOpenChange={setSSIDDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update WiFi SSID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>SSID (Network Name)</Label>
              <Input placeholder="Enter new SSID" value={ssidDraft} onChange={(e) => setSSIDDraft(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password (Optional)</Label>
              <Input type="password" placeholder="Leave blank to keep current" value={ssidPassword} onChange={(e) => setSSIDPassword(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setSSIDDialogOpen(false); setSSIDDraft(""); setSSIDPassword(""); }}>Cancel</Button>
              <Button onClick={handleUpdateSSID} disabled={actionLoading || !ssidDraft.trim()}>
                {actionLoading ? "Updating..." : "Update SSID"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update MTU Dialog */}
      <Dialog open={mtuDialogOpen} onOpenChange={setMTUDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update MTU</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>MTU Value</Label>
              <Input type="number" min="68" max="9000" placeholder="Enter MTU value (68-9000)" value={mtuDraft} onChange={(e) => setMTUDraft(e.target.value)} />
              <p className="text-sm text-muted-foreground">Common values: 1500 (standard), 1492 (PPPoE), 1420 (VPN)</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setMTUDialogOpen(false); setMTUDraft("1500"); }}>Cancel</Button>
              <Button onClick={handleUpdateMTU} disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Update MTU"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
