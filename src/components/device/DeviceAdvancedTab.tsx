"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DeviceTabProps } from "@/types/device";
import {
  fetchAvailableIPs,
  fetchPortForwardRules,
  createPortForwardRule,
  deletePortForwardRule,
} from "@/server/port-forwarding";
import {
  fetchDedicatedIPRules,
  createDedicatedIPRule,
  recheckDedicatedIPRule,
  deleteDedicatedIPRule,
} from "@/server/dedicated-ip";
import {
  fetchBridgedIPRules,
  createBridgedIPRule,
  deleteBridgedIPRule,
} from "@/server/bridged-ip";

interface PFRuleRow { id: number; rule_name?: string; name?: string; protocol?: string; external_port?: number; internal_ip?: string; internal_port?: number; enabled?: boolean }
interface DedicatedRuleRow { id: number; dedicated_ip?: string; internal_ip?: string; status?: string }
interface BridgedRuleRow { id: number; bridged_ip?: string; internal_ip?: string; status?: string }
interface AvailableIPRow { ip?: string }

export function DeviceAdvancedTab({ serial, sparqfiPermissions }: DeviceTabProps) {
  const canPortForward = sparqfiPermissions?.canPortForward !== false;
  const canDedicatedIp = sparqfiPermissions?.canDedicatedIp !== false;
  const canBridgedIp = sparqfiPermissions?.canBridgedIp !== false;
  const defaultSubTab = canPortForward ? "port-forwarding" : canDedicatedIp ? "dedicated-ip" : "bridged-ip";
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  // Port Forwarding state
  const [pfRules, setPfRules] = useState<PFRuleRow[]>([]);
  const [pfLoading, setPfLoading] = useState(true);
  const [pfDialogOpen, setPfDialogOpen] = useState(false);
  const [availableIPs, setAvailableIPs] = useState<(string | AvailableIPRow)[]>([]);
  const [pfForm, setPfForm] = useState({
    rule_name: "",
    protocol: "TCP" as "TCP" | "UDP" | "BOTH",
    external_port: "",
    internal_ip: "",
    internal_port: "",
  });

  // Dedicated IP state
  const [dedicatedRules, setDedicatedRules] = useState<DedicatedRuleRow[]>([]);
  const [dedicatedLoading, setDedicatedLoading] = useState(true);
  const [dedicatedDialogOpen, setDedicatedDialogOpen] = useState(false);
  const [dedicatedInternalIP, setDedicatedInternalIP] = useState("");

  // Bridged IP state
  const [bridgedRules, setBridgedRules] = useState<BridgedRuleRow[]>([]);
  const [bridgedLoading, setBridgedLoading] = useState(true);
  const [bridgedDialogOpen, setBridgedDialogOpen] = useState(false);
  const [bridgedInternalIP, setBridgedInternalIP] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Load data
  useEffect(() => {
    if (!serial) return;

    fetchPortForwardRules(serial)
      .then((data) => setPfRules(Array.isArray(data) ? data : data?.rules ?? []))
      .catch(() => {})
      .finally(() => setPfLoading(false));

    fetchDedicatedIPRules(serial)
      .then((data) => setDedicatedRules(Array.isArray(data) ? data : data?.rules ?? []))
      .catch(() => {})
      .finally(() => setDedicatedLoading(false));

    fetchBridgedIPRules(serial)
      .then((data) => setBridgedRules(Array.isArray(data) ? data : data?.rules ?? []))
      .catch(() => {})
      .finally(() => setBridgedLoading(false));

    fetchAvailableIPs()
      .then((data) => setAvailableIPs(Array.isArray(data) ? data : data?.ips ?? []))
      .catch(() => {});
  }, [serial]);

  // Port Forwarding handlers
  const handleCreatePFRule = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      await createPortForwardRule(serial, {
        rule_name: pfForm.rule_name,
        protocol: pfForm.protocol,
        external_port: parseInt(pfForm.external_port, 10),
        internal_ip: pfForm.internal_ip,
        internal_port: parseInt(pfForm.internal_port, 10),
      });
      toast.success("Port forwarding rule created");
      setPfDialogOpen(false);
      setPfForm({ rule_name: "", protocol: "TCP", external_port: "", internal_ip: "", internal_port: "" });
      const data = await fetchPortForwardRules(serial);
      setPfRules(Array.isArray(data) ? data : data?.rules ?? []);
    } catch (e: unknown) {
      toast.error("Failed to create rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePFRule = async (ruleId: number) => {
    try {
      setActionLoading(true);
      await deletePortForwardRule(serial, ruleId);
      toast.success("Port forwarding rule deleted");
      setPfRules((prev) => prev.filter((r) => r.id !== ruleId));
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error("Failed to delete rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Dedicated IP handlers
  const handleCreateDedicatedRule = async () => {
    if (actionLoading || !dedicatedInternalIP.trim()) return;
    try {
      setActionLoading(true);
      await createDedicatedIPRule(serial, { internal_ip: dedicatedInternalIP.trim() });
      toast.success("Dedicated IP rule created");
      setDedicatedDialogOpen(false);
      setDedicatedInternalIP("");
      const data = await fetchDedicatedIPRules(serial);
      setDedicatedRules(Array.isArray(data) ? data : data?.rules ?? []);
    } catch (e: unknown) {
      toast.error("Failed to create rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecheckDedicatedRule = async (ruleId: number) => {
    try {
      setActionLoading(true);
      await recheckDedicatedIPRule(serial, ruleId);
      toast.success("Recheck initiated");
      const data = await fetchDedicatedIPRules(serial);
      setDedicatedRules(Array.isArray(data) ? data : data?.rules ?? []);
    } catch (e: unknown) {
      toast.error("Failed to recheck rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDedicatedRule = async (ruleId: number) => {
    try {
      setActionLoading(true);
      await deleteDedicatedIPRule(serial, ruleId);
      toast.success("Dedicated IP rule deleted");
      setDedicatedRules((prev) => prev.filter((r) => r.id !== ruleId));
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error("Failed to delete rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Bridged IP handlers
  const handleCreateBridgedRule = async () => {
    if (actionLoading || !bridgedInternalIP.trim()) return;
    try {
      setActionLoading(true);
      await createBridgedIPRule(serial, { internal_ip: bridgedInternalIP.trim() });
      toast.success("Bridged IP rule created");
      setBridgedDialogOpen(false);
      setBridgedInternalIP("");
      const data = await fetchBridgedIPRules(serial);
      setBridgedRules(Array.isArray(data) ? data : data?.rules ?? []);
    } catch (e: unknown) {
      toast.error("Failed to create rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBridgedRule = async (ruleId: number) => {
    try {
      setActionLoading(true);
      await deleteBridgedIPRule(serial, ruleId);
      toast.success("Bridged IP rule deleted");
      setBridgedRules((prev) => prev.filter((r) => r.id !== ruleId));
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error("Failed to delete rule", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          {canPortForward && <TabsTrigger value="port-forwarding">Port Forwarding</TabsTrigger>}
          {canDedicatedIp && <TabsTrigger value="dedicated-ip">Dedicated IP</TabsTrigger>}
          {canBridgedIp && <TabsTrigger value="bridged-ip">Bridged IP</TabsTrigger>}
        </TabsList>

        {/* Port Forwarding */}
        {canPortForward && <TabsContent value="port-forwarding">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Port Forwarding Rules</CardTitle>
              <Button size="sm" onClick={() => setPfDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {pfLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading rules...</span>
                </div>
              ) : pfRules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No port forwarding rules configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>External Port</TableHead>
                      <TableHead>Internal IP</TableHead>
                      <TableHead>Internal Port</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pfRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.rule_name || rule.name || "N/A"}</TableCell>
                        <TableCell>{rule.protocol || "N/A"}</TableCell>
                        <TableCell>{rule.external_port ?? "N/A"}</TableCell>
                        <TableCell className="font-mono">{rule.internal_ip || "N/A"}</TableCell>
                        <TableCell>{rule.internal_port ?? "N/A"}</TableCell>
                        <TableCell>{rule.enabled ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTarget({ type: "pf", id: rule.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>}

        {/* Dedicated IP */}
        {canDedicatedIp && <TabsContent value="dedicated-ip">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Dedicated IP Rules</CardTitle>
              <Button size="sm" onClick={() => setDedicatedDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {dedicatedLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading rules...</span>
                </div>
              ) : dedicatedRules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No dedicated IP rules configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dedicated IP</TableHead>
                      <TableHead>Internal IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dedicatedRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono">{rule.dedicated_ip || "N/A"}</TableCell>
                        <TableCell className="font-mono">{rule.internal_ip || "N/A"}</TableCell>
                        <TableCell>{rule.status || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRecheckDedicatedRule(rule.id)}
                              disabled={actionLoading}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteTarget({ type: "dedicated", id: rule.id })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>}

        {/* Bridged IP */}
        {canBridgedIp && <TabsContent value="bridged-ip">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-medium">Bridged IP Rules</CardTitle>
              <Button size="sm" onClick={() => setBridgedDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {bridgedLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading rules...</span>
                </div>
              ) : bridgedRules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No bridged IP rules configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bridged IP</TableHead>
                      <TableHead>Internal IP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bridgedRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono">{rule.bridged_ip || "N/A"}</TableCell>
                        <TableCell className="font-mono">{rule.internal_ip || "N/A"}</TableCell>
                        <TableCell>{rule.status || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteTarget({ type: "bridged", id: rule.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>}
      </Tabs>

      {/* Add Port Forwarding Rule Dialog */}
      <Dialog open={pfDialogOpen} onOpenChange={setPfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Port Forwarding Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input value={pfForm.rule_name} onChange={(e) => setPfForm((p) => ({ ...p, rule_name: e.target.value }))} placeholder="My Rule" />
            </div>
            <div className="space-y-2">
              <Label>Protocol</Label>
              <Select value={pfForm.protocol} onValueChange={(v) => setPfForm((p) => ({ ...p, protocol: v as "TCP" | "UDP" | "BOTH" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TCP">TCP</SelectItem>
                  <SelectItem value="UDP">UDP</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External Port</Label>
              <Input type="number" value={pfForm.external_port} onChange={(e) => setPfForm((p) => ({ ...p, external_port: e.target.value }))} placeholder="8080" />
            </div>
            <div className="space-y-2">
              <Label>Internal IP</Label>
              {availableIPs.length > 0 ? (
                <Select value={pfForm.internal_ip} onValueChange={(v) => setPfForm((p) => ({ ...p, internal_ip: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select IP" /></SelectTrigger>
                  <SelectContent>
                    {availableIPs.map((ip, i) => {
                      const ipStr = typeof ip === "string" ? ip : (ip.ip ?? "");
                      return <SelectItem key={i} value={ipStr}>{ipStr}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={pfForm.internal_ip} onChange={(e) => setPfForm((p) => ({ ...p, internal_ip: e.target.value }))} placeholder="192.168.1.100" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Internal Port</Label>
              <Input type="number" value={pfForm.internal_port} onChange={(e) => setPfForm((p) => ({ ...p, internal_port: e.target.value }))} placeholder="80" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPfDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePFRule} disabled={actionLoading || !pfForm.rule_name || !pfForm.external_port || !pfForm.internal_ip || !pfForm.internal_port}>
                {actionLoading ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dedicated IP Rule Dialog */}
      <Dialog open={dedicatedDialogOpen} onOpenChange={setDedicatedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dedicated IP Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Internal IP</Label>
              <Input value={dedicatedInternalIP} onChange={(e) => setDedicatedInternalIP(e.target.value)} placeholder="192.168.1.100" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDedicatedDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateDedicatedRule} disabled={actionLoading || !dedicatedInternalIP.trim()}>
                {actionLoading ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bridged IP Rule Dialog */}
      <Dialog open={bridgedDialogOpen} onOpenChange={setBridgedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bridged IP Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Internal IP</Label>
              <Input value={bridgedInternalIP} onChange={(e) => setBridgedInternalIP(e.target.value)} placeholder="192.168.1.100" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBridgedDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBridgedRule} disabled={actionLoading || !bridgedInternalIP.trim()}>
                {actionLoading ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete this rule? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "pf") handleDeletePFRule(deleteTarget.id);
                else if (deleteTarget.type === "dedicated") handleDeleteDedicatedRule(deleteTarget.id);
                else if (deleteTarget.type === "bridged") handleDeleteBridgedRule(deleteTarget.id);
              }}
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
