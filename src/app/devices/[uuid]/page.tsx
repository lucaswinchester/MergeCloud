"use client";

import { useEffect, useMemo, useState, useRef, useCallback, use } from "react";
import { Edit3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider as SidebarContextProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Clock,
  Download,
  Home,
  MoreHorizontal,
  Network,
  Power,
  RefreshCw,
  RotateCcw,
  Settings2,
  Wifi,
  Wifi as WifiIcon,
} from "lucide-react";

import {
  fetchDeviceInfo,
  fetchNotes as fetchNotesServer,
  createNote,
  fetchDevicePlans,
  updateDevicePlan,
  updateLabel,
  fetchPortGroups,
  changeDevicePortGroup,
  restartDevice,
  triggerSpeedTest,
  triggerNetworkScan,
  installUptimeRestart,
  resetDeviceConfig,
} from "@/server/iqapi";

import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { DeviceInfo } from "@/types/device";
import { toMono, formatBytes, stripSpqPrefix } from "@/components/device/device-utils";
import { ActivationBadge, ReachabilityBadge, SimStatusBadge, PassStatusBadge } from "@/components/device/device-badges";
import { MetricCard } from "@/components/device/MetricCard";
import { DeviceReports } from "@/components/device/DeviceReports";
import { DeviceNetworkTab } from "@/components/device/DeviceNetworkTab";
import { DeviceNotesTab } from "@/components/device/DeviceNotesTab";
import { DeviceSettingsTab } from "@/components/device/DeviceSettingsTab";
import { DeviceActions } from "@/components/device/DeviceActions";
import { DeviceAdvancedTab } from "@/components/device/DeviceAdvancedTab";

interface UINote {
  notes: string;
  user_full_name: string;
  created_at: string;
  id?: string;
}

interface DevicePlan {
  plan_uuid: string;
  name: string;
}

interface PortGroup {
  uuid: string;
  name: string;
  displayName: string;
  is_assigned?: boolean;
}

export default function DevicePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const { permissions } = useOrgPermissions();
  const sparqfiPermissions = permissions?.sparqfiPermissions ?? {};

  const deviceData = useMemo(() => ({ uuid }), [uuid]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState<UINote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [labelOpen, setLabelOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [ssidDialogOpen, setSSIDDialogOpen] = useState(false);
  const [mtuDialogOpen, setMTUDialogOpen] = useState(false);

  const [isPollingBoosted, setIsPollingBoosted] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const boostTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Overview tab state
  const [overviewState, setOverviewState] = useState({
    plan: "",
    portGroup: "",
    loading: { plans: true, portGroups: true },
    modals: { plan: false, portGroup: false },
  });

  const [plans, setPlans] = useState<DevicePlan[]>([]);
  const [portGroups, setPortGroups] = useState<PortGroup[]>([]);

  // Load device plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, plans: true } }));
        const plansData = await fetchDevicePlans();
        setPlans(plansData);
        if (device?.device?.deviceplan) {
          const currentPlan = plansData.find((p) => p.name === device.device.deviceplan);
          setOverviewState((prev) => ({
            ...prev,
            plan: currentPlan?.plan_uuid ?? "",
            loading: { ...prev.loading, plans: false },
          }));
          return;
        }
      } catch (error) {
        console.error("Error loading plans:", error);
      } finally {
        setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, plans: false } }));
      }
    };
    loadPlans();
  }, [device?.device?.deviceplan]);

  // Load port groups
  useEffect(() => {
    const loadPortGroups = async () => {
      try {
        setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, portGroups: true } }));
        const groupsData = await fetchPortGroups();
        const normalized: PortGroup[] = Array.isArray(groupsData)
          ? groupsData.map((g: { uuid?: string; name?: string; is_assigned?: boolean }) => ({
              uuid: String(g?.uuid ?? ""),
              name: String(g?.name ?? ""),
              displayName: stripSpqPrefix(String(g?.name ?? "")) || String(g?.name ?? ""),
              is_assigned: Boolean(g?.is_assigned),
            }))
          : [];
        const currentName = device?.device?.portgroups ? stripSpqPrefix(device.device.portgroups) : "";
        const current = currentName ? normalized.find((g) => g.displayName === currentName) : undefined;
        setPortGroups(normalized);
        setOverviewState((prev) => ({
          ...prev,
          portGroup: current?.uuid ?? "",
          loading: { ...prev.loading, portGroups: false },
        }));
      } catch (e) {
        console.error("Error loading port groups:", e);
      } finally {
        setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, portGroups: false } }));
      }
    };
    loadPortGroups();
  }, [device?.device?.portgroups]);

  const handlePlanChange = async (planUuid: string) => {
    if (!planUuid) return false;
    try {
      setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, plans: true } }));
      await updateDevicePlan(uuid, planUuid);
      const selectedPlan = plans.find((p) => p.plan_uuid === planUuid);
      if (selectedPlan) {
        setOverviewState((prev) => ({ ...prev, plan: planUuid, loading: { ...prev.loading, plans: false } }));
        setDevice((prev) => {
          if (!prev) return prev;
          return { ...prev, device: { ...prev.device, deviceplan: selectedPlan.name } };
        });
        toast.success("Plan updated", { description: selectedPlan.name });
      }
      return true;
    } catch (error) {
      toast.error("Failed to update plan", { description: error instanceof Error ? error.message : "Unknown error" });
      return false;
    } finally {
      setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, plans: false } }));
    }
  };

  const handlePortGroupChange = async (portGroupUuid: string) => {
    if (!portGroupUuid) return false;
    try {
      setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, portGroups: true } }));
      await changeDevicePortGroup(uuid, portGroupUuid);
      const selected = portGroups.find((g) => g.uuid === portGroupUuid);
      if (selected) {
        setOverviewState((prev) => ({ ...prev, portGroup: portGroupUuid, loading: { ...prev.loading, portGroups: false } }));
        setDevice((prev) => {
          if (!prev) return prev;
          return { ...prev, device: { ...prev.device, portgroups: `SpQ : ${selected.displayName}` } };
        });
        toast.success("Preferred carrier updated", { description: selected.displayName });
      }
      return true;
    } catch (e) {
      toast.error("Failed to update preferred carrier", { description: e instanceof Error ? e.message : "Unknown error" });
      return false;
    } finally {
      setOverviewState((prev) => ({ ...prev, loading: { ...prev.loading, portGroups: false } }));
    }
  };

  const toggleModal = (modal: "plan" | "portGroup", isOpen: boolean) => {
    setOverviewState((prev) => ({ ...prev, modals: { ...prev.modals, [modal]: isOpen } }));
  };

  const refreshDeviceStatus = useCallback(async () => {
    try {
      const deviceInfo = await fetchDeviceInfo(uuid);
      setDevice(deviceInfo);
    } catch (error) {
      console.error("Error refreshing device status:", error);
    }
  }, [uuid]);

  const triggerBoostMode = useCallback(() => {
    if (boostTimeoutRef.current) clearTimeout(boostTimeoutRef.current);
    setIsPollingBoosted(true);
    boostTimeoutRef.current = setTimeout(() => setIsPollingBoosted(false), 30000);
  }, []);

  // Device action handlers
  const handleRestartDevice = async () => {
    if (!uuid || actionLoading) return;
    try {
      setActionLoading(true);
      await restartDevice(uuid);
      toast.success("Device restart initiated", { description: "The device will restart shortly." });
      triggerBoostMode();
    } catch (error) {
      toast.error("Failed to restart device", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpeedTest = async (testType: 1 | 2) => {
    if (!uuid || actionLoading) return;
    const testName = testType === 1 ? "Rapid" : "Normal";
    try {
      setActionLoading(true);
      await triggerSpeedTest(uuid, testType);
      toast.success(`${testName} speed test initiated`, { description: "Check the Reports tab for results." });
      triggerBoostMode();
    } catch (error) {
      toast.error(`Failed to start ${testName.toLowerCase()} speed test`, { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNetworkScan = async () => {
    if (!uuid || actionLoading) return;
    try {
      setActionLoading(true);
      await triggerNetworkScan(uuid);
      toast.success("Network scan initiated", { description: "Check the Reports tab for results." });
      triggerBoostMode();
    } catch (error) {
      toast.error("Failed to start network scan", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstallUptimeRestart = async () => {
    if (!uuid || actionLoading) return;
    try {
      setActionLoading(true);
      await installUptimeRestart(uuid);
      toast.success("Uptime-restart installation initiated");
    } catch (error) {
      toast.error("Failed to install uptime-restart", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetConfig = async () => {
    if (!uuid || actionLoading) return;
    try {
      setActionLoading(true);
      await resetDeviceConfig(uuid);
      toast.success("Device config reset initiated");
      triggerBoostMode();
    } catch (error) {
      toast.error("Failed to reset device config", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Load device data
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isMounted.current = true;
    const loadDevice = async () => {
      try {
        setLoading(true);
        const deviceInfo = await fetchDeviceInfo(deviceData.uuid);
        if (!isMounted.current) return;
        setDevice(deviceInfo);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error loading device:", error);
        if (isMounted.current) setLoadError("Failed to load device data");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    loadDevice();
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, [deviceData.uuid]);

  // Adaptive polling
  useEffect(() => {
    if (!uuid || loading) return;
    const startPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      const interval = isPollingBoosted ? 5000 : 15000;
      pollingIntervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") refreshDeviceStatus();
      }, interval);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDeviceStatus();
        startPolling();
      } else {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (boostTimeoutRef.current) clearTimeout(boostTimeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [uuid, loading, isPollingBoosted, refreshDeviceStatus]);

  // Load notes
  useEffect(() => {
    let mounted = true;
    const loadNotes = async () => {
      try {
        setNotesLoading(true);
        const notesData = await fetchNotesServer(deviceData.uuid);
        if (!mounted) return;
        if (!Array.isArray(notesData)) { setNotes([]); return; }
        const formatted: UINote[] = notesData.map((n: { id?: string | number; notes?: string; user_full_name?: string; created_at?: string }) => ({
          id: String(n.id || ""),
          notes: n.notes || "",
          user_full_name: n.user_full_name || "Unknown",
          created_at: n.created_at || new Date().toISOString(),
        }));
        setNotes(formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setNotesError(null);
      } catch {
        if (mounted) setNotesError("Failed to load notes");
      } finally {
        if (mounted) setNotesLoading(false);
      }
    };
    loadNotes();
    return () => { mounted = false; };
  }, [deviceData.uuid]);

  const handleAddNote = async () => {
    const content = newNote.trim();
    if (!content) return;
    try {
      setNotesLoading(true);
      setNotesError(null);
      await createNote(deviceData.uuid, content);
      setNewNote("");
      const updatedNotes = await fetchNotesServer(deviceData.uuid);
      if (Array.isArray(updatedNotes)) {
        const formatted = updatedNotes.map((n: { id?: string | number; notes?: string; user_full_name?: string; created_at?: string }) => ({
          id: String(n.id || ""),
          notes: n.notes || "",
          user_full_name: n.user_full_name || "Unknown",
          created_at: n.created_at || new Date().toISOString(),
        }));
        setNotes(formatted);
      }
    } catch {
      setNotesError("Failed to add note. Please try again.");
    } finally {
      setNotesLoading(false);
    }
  };

  const deviceLabel = useMemo(() => {
    if (!device) return "";
    return device.device.label || device.device.serial || device.db_info.serial_no || device.db_info.uuid;
  }, [device]);

  // Shared props for tab components
  const tabProps = useMemo(() => {
    if (!device) return null;
    return {
      device,
      uuid,
      serial: device.device.serial,
      onDeviceUpdate: setDevice as (updater: (prev: DeviceInfo | null) => DeviceInfo | null) => void,
      actionLoading,
      setActionLoading,
      triggerBoostMode,
      sparqfiPermissions,
    };
  }, [device, uuid, actionLoading, triggerBoostMode, sparqfiPermissions]);

  if (loading) {
    return (
      <SidebarContextProvider>
        <AppSidebar />
        <SidebarInset className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/" className="flex items-center gap-1"><Home className="h-4 w-4" />Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/devices">Devices</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Loading...</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <SidebarTrigger className="md:hidden" />
          </div>
          <div className="flex items-center justify-center h-64">
            <p>Loading device information...</p>
          </div>
        </SidebarInset>
      </SidebarContextProvider>
    );
  }

  if (loadError || !device) {
    return (
      <SidebarContextProvider>
        <AppSidebar />
        <SidebarInset className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/" className="flex items-center gap-1"><Home className="h-4 w-4" />Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/devices">Devices</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Error</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <SidebarTrigger className="md:hidden" />
          </div>
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">{loadError || "Device not found"}</p>
          </div>
        </SidebarInset>
      </SidebarContextProvider>
    );
  }

  return (
    <SidebarContextProvider>
      <AppSidebar />
      <SidebarInset className="p-6 space-y-8">
        {/* Header: Breadcrumbs + action dropdown */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/" className="flex items-center gap-1"><Home className="h-4 w-4" />Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/devices">Devices</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{deviceLabel}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading}><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRestartDevice} disabled={actionLoading}><RefreshCw className="h-4 w-4 mr-2" />Restart Device</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSpeedTest(2)} disabled={actionLoading}><Activity className="h-4 w-4 mr-2" />Normal Speed Test</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSpeedTest(1)} disabled={actionLoading}><Activity className="h-4 w-4 mr-2" />Rapid Speed Test</DropdownMenuItem>
                <DropdownMenuItem onClick={handleNetworkScan} disabled={actionLoading}><Network className="h-4 w-4 mr-2" />Network Scan</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <SidebarTrigger className="md:hidden" />
          </div>
        </div>

        {/* Title + label + badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold tracking-tight">{deviceLabel}</h1>
                <Popover open={labelOpen} onOpenChange={setLabelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Edit label"
                      onClick={() => { setLabelError(null); setLabelDraft(device?.device?.label ?? ""); }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Label</h4>
                        <p className="text-sm text-muted-foreground">Set a label for this device.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="device-label">Label</Label>
                          <Input id="device-label" value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} className="col-span-2 h-8" />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Button
                            disabled={labelSaving}
                            onClick={async () => {
                              if (!device?.db_info?.uuid) return;
                              setLabelSaving(true);
                              setLabelError(null);
                              try {
                                const result = await updateLabel(device.db_info.uuid, labelDraft);
                                setDevice((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    device: { ...prev.device, label: result?.label ?? labelDraft },
                                    db_info: { ...prev.db_info, label: result?.label ?? labelDraft },
                                  };
                                });
                                setLabelOpen(false);
                              } catch {
                                setLabelError("Error updating label");
                              } finally {
                                setLabelSaving(false);
                              }
                            }}
                          >
                            {labelSaving ? "Updating..." : "Update"}
                          </Button>
                        </div>
                        {labelError && <p className="text-destructive">{labelError}</p>}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-muted-foreground text-lg">{toMono(device.device.serial || device.db_info.serial_no)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <ActivationBadge active={Boolean(device.db_info.is_activated)} />
              <ReachabilityBadge statusCode={device.device.status} statusText={device.device.status_formatted || device.db_info.status_formatted} />
              <SimStatusBadge status={device.port.status_formatted} />
              <PassStatusBadge status={device.device.pass_status_formatted} />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-6">
          <MetricCard title="Plan" value={device?.device?.deviceplan || "Not set"} onEdit={() => toggleModal("plan", true)} />

          <Dialog open={overviewState.modals.plan} onOpenChange={(open) => toggleModal("plan", open)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Select Plan</DialogTitle></DialogHeader>
              <div className="py-4">
                <Select
                  value={overviewState.plan}
                  onValueChange={async (value) => { const ok = await handlePlanChange(value); if (ok) toggleModal("plan", false); }}
                  disabled={overviewState.loading.plans}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder={device?.device?.deviceplan || "Select a plan"} /></SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.plan_uuid} value={plan.plan_uuid}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>

          <MetricCard title="Preferred Carrier (Port Group)" value={device?.device?.portgroups ? stripSpqPrefix(device.device.portgroups) : "Not set"} onEdit={() => toggleModal("portGroup", true)} />

          <Dialog open={overviewState.modals.portGroup} onOpenChange={(open) => toggleModal("portGroup", open)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Select Port Group</DialogTitle></DialogHeader>
              <div className="py-4">
                <Select
                  value={overviewState.portGroup}
                  onValueChange={async (value) => { const ok = await handlePortGroupChange(value); if (ok) toggleModal("portGroup", false); }}
                  disabled={overviewState.loading.portGroups}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={device?.device?.portgroups ? stripSpqPrefix(device.device.portgroups) : "Select port group"} />
                  </SelectTrigger>
                  <SelectContent>
                    {portGroups.map((group) => (
                      <SelectItem key={group.uuid} value={group.uuid}>
                        {group.displayName || stripSpqPrefix(group.name) || group.name || group.uuid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>

          <MetricCard title="Data Used" value={formatBytes(device.db_info.used_data || 0)} />
          <MetricCard title="Device Type" value={device.device.device_type || "Unknown"} />
        </div>

        <Separator className="mb-6" />

        {/* Tabs */}
        <Tabs defaultValue="network" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="network">Network</TabsTrigger>
              {(sparqfiPermissions.canPortForward || sparqfiPermissions.canDedicatedIp || sparqfiPermissions.canBridgedIp) && (
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              )}
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="outline" size="sm" className="h-9"><Download className="h-4 w-4 mr-2" />Export</Button>
              <Button
                variant="outline" size="sm" className="h-9"
                onClick={async () => {
                  setLoading(true);
                  setLoadError(null);
                  try {
                    const data = await fetchDeviceInfo(deviceData.uuid);
                    setDevice(data);
                    const notesData = await fetchNotesServer(deviceData.uuid);
                    if (Array.isArray(notesData)) {
                      const formatted = notesData.map((n: Record<string, unknown>) => ({
                        id: String(n.id || ""),
                        notes: String(n.notes || ""),
                        user_full_name: String(n.user_full_name || "Unknown"),
                        created_at: String(n.created_at || new Date().toISOString()),
                      }));
                      setNotes(formatted);
                    }
                  } catch {
                    setLoadError("Failed to refresh device information");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9" disabled={actionLoading}><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setScheduleDialogOpen(true)} disabled={actionLoading}><Clock className="h-4 w-4 mr-2" />Schedule Device Restart</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRestartDevice} disabled={actionLoading}><Power className="h-4 w-4 mr-2" />Restart Device</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleInstallUptimeRestart} disabled={actionLoading}><RotateCcw className="h-4 w-4 mr-2" />Install uptime-restart</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSSIDDialogOpen(true)} disabled={actionLoading}><WifiIcon className="h-4 w-4 mr-2" />Update SSID</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResetConfig} disabled={actionLoading}><Settings2 className="h-4 w-4 mr-2" />Reset Device Config</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMTUDialogOpen(true)} disabled={actionLoading}><Network className="h-4 w-4 mr-2" />Update MTU</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSpeedTest(1)} disabled={actionLoading}><Activity className="h-4 w-4 mr-2" />Rapid Speed Test</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSpeedTest(2)} disabled={actionLoading}><RefreshCw className="h-4 w-4 mr-2" />Normal Speed Test</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNetworkScan} disabled={actionLoading}><Wifi className="h-4 w-4 mr-2" />Net Scan</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="mt-6" />

          <TabsContent value="network" className="mt-6 px-4 md:px-2">
            {tabProps && <DeviceNetworkTab {...tabProps} />}
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            {tabProps && <DeviceAdvancedTab {...tabProps} />}
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <DeviceReports deviceUuid={uuid} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6 space-y-4">
            <DeviceNotesTab
              notes={notes}
              newNote={newNote}
              setNewNote={setNewNote}
              notesLoading={notesLoading}
              notesError={notesError}
              onAddNote={handleAddNote}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-8 mt-6">
            {tabProps && <DeviceSettingsTab {...tabProps} />}
          </TabsContent>
        </Tabs>

        {/* Action Dialogs (Schedule Restart, SSID, MTU) */}
        {tabProps && (
          <DeviceActions
            {...tabProps}
            scheduleDialogOpen={scheduleDialogOpen}
            setScheduleDialogOpen={setScheduleDialogOpen}
            ssidDialogOpen={ssidDialogOpen}
            setSSIDDialogOpen={setSSIDDialogOpen}
            mtuDialogOpen={mtuDialogOpen}
            setMTUDialogOpen={setMTUDialogOpen}
          />
        )}
      </SidebarInset>
    </SidebarContextProvider>
  );
}
