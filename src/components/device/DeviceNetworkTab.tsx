"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Radio, Clock, Wifi, Signal, ScanLine } from "lucide-react";
import { InfoRow } from "./InfoRow";
import { toTitle } from "./device-utils";
import { DeviceTabProps } from "@/types/device";
import {
  fetchM1Info,
  fetchConnectionCount,
  fetchConnectionDetails,
  fetchServingCellInfo,
  fetchSimActivity,
  fetchDeviceUptime,
} from "@/server/device-monitoring";

interface ConnectedDeviceRow { ip?: string; mac?: string; hostname?: string }
interface ServingCellRow { id?: number; sci_time?: number; time?: string; sci_operator?: string; operator?: string; sci_cellid?: string; cell_id?: string; sci_rat?: string; rat?: string; sci_band?: string; band?: string; sci_signal?: string; signal?: string }
interface SimActivityRow { id?: number; action?: string; timestamp?: string; created_at?: string }
interface UptimeInfo { uptime?: number; uptime_formatted?: string; last_restart?: string }

export function DeviceNetworkTab({ device, uuid }: DeviceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const [m1Info, setM1Info] = useState<Record<string, unknown> | null>(null);
  const [connectionCount, setConnectionCount] = useState<number | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDeviceRow[]>([]);
  const [servingCellHistory, setServingCellHistory] = useState<ServingCellRow[]>([]);
  const [servingCellPage, setServingCellPage] = useState(1);
  const [servingCellTotal, setServingCellTotal] = useState(0);
  const [simActivity, setSimActivity] = useState<SimActivityRow[]>([]);
  const [simActivityPage, setSimActivityPage] = useState(1);
  const [simActivityTotal, setSimActivityTotal] = useState(0);
  const [uptimeData, setUptimeData] = useState<UptimeInfo | null>(null);

  const [loading, setLoading] = useState({
    m1Info: true,
    connections: true,
    servingCell: true,
    simActivity: true,
    uptime: true,
  });

  useEffect(() => {
    // Uptime
    fetchDeviceUptime(uuid)
      .then((data) => setUptimeData(data))
      .catch(() => {})
      .finally(() => setLoading((p) => ({ ...p, uptime: false })));

    // Connections
    Promise.all([fetchConnectionCount(uuid), fetchConnectionDetails(uuid)])
      .then(([count, details]) => {
        setConnectionCount(typeof count === "number" ? count : count?.count ?? null);
        setConnectedDevices(Array.isArray(details) ? details : details?.devices ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading((p) => ({ ...p, connections: false })));

    // M1 Info
    fetchM1Info(uuid)
      .then((data) => setM1Info(data))
      .catch(() => setM1Info(null))
      .finally(() => setLoading((p) => ({ ...p, m1Info: false })));

    // Serving Cell History
    fetchServingCellInfo(uuid, 1, 10)
      .then((data) => {
        setServingCellHistory(data?.cells ?? data?.items ?? []);
        setServingCellTotal(data?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading((p) => ({ ...p, servingCell: false })));

    // SIM Activity
    fetchSimActivity(uuid, 1, 10)
      .then((data) => {
        setSimActivity(data?.items ?? data?.cells ?? []);
        setSimActivityTotal(data?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading((p) => ({ ...p, simActivity: false })));
  }, [uuid]);

  const loadServingCellPage = async (page: number) => {
    setLoading((p) => ({ ...p, servingCell: true }));
    try {
      const data = await fetchServingCellInfo(uuid, page, 10);
      setServingCellHistory(data?.cells ?? data?.items ?? []);
      setServingCellTotal(data?.total ?? 0);
      setServingCellPage(page);
    } catch {}
    setLoading((p) => ({ ...p, servingCell: false }));
  };

  const loadSimActivityPage = async (page: number) => {
    setLoading((p) => ({ ...p, simActivity: true }));
    try {
      const data = await fetchSimActivity(uuid, page, 10);
      setSimActivity(data?.items ?? data?.cells ?? []);
      setSimActivityTotal(data?.total ?? 0);
      setSimActivityPage(page);
    } catch {}
    setLoading((p) => ({ ...p, simActivity: false }));
  };

  const formatUnixSeconds = (ts: number) => new Date(ts * 1000).toLocaleString();

  return (
    <div className="w-full">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Wifi className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Connections
            {connectionCount !== null && connectionCount > 0 && (
              <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0 rounded-full font-medium">
                {connectionCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cellular" className="gap-1.5">
            <Signal className="h-3.5 w-3.5" />
            Cellular
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Network + Cell Info side by side */}
          <div className="flex flex-row flex-wrap gap-6 items-stretch w-full">
            <div className="flex-1 basis-1/2 min-w-0">
              <Card className="h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Network Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-6">
                  <InfoRow label="SIM Provider" value={toTitle(device.port.sim_provider, "N/A")} />
                  <InfoRow label="IP Address" mono value={device.device.ip || "N/A"} />
                  <InfoRow label="SSH Port" value={toTitle(device.device.sshport, "N/A")} />
                  <InfoRow label="MAC Address" mono value={toTitle(device.db_info.mac_address, "N/A")} />
                  <InfoRow label="Port ID" value={String(device.port.id)} />
                  <InfoRow label="Port Group" value={toTitle(device.port.id_portgroup, "N/A")} />
                  <InfoRow label="Port Status" value={device.port.status === 0 ? "Active" : "Inactive"} />
                </CardContent>
              </Card>
            </div>

            {device.cell_info && (
              <div className="flex-1 basis-1/2 min-w-0">
                <Card className="h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Signal className="h-4 w-4" />
                      Cell Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-6">
                    <InfoRow label="Cell ID" mono value={toTitle(device.cell_info.sci_cellid, "N/A")} />
                    <InfoRow label="LAC" value={toTitle(device.cell_info.sci_lac, "N/A")} />
                    <InfoRow label="RAT" value={toTitle(device.cell_info.sci_rat, "N/A")} />
                    <InfoRow label="Signal" value={toTitle(device.cell_info.sci_signal, "N/A")} />
                    <InfoRow label="Band" value={toTitle(device.cell_info.sci_band, "N/A")} />
                    <InfoRow label="Bandwidth" value={toTitle(device.cell_info.sci_bandwidth, "N/A")} />
                    <InfoRow label="EN-DC Active" value={device.cell_info.sci_endc_active ? "Yes" : "No"} />
                    <InfoRow label="EN-DC Signal" value={toTitle(device.cell_info.sci_endc_signal, "N/A")} />
                    <InfoRow
                      label="CA Info"
                      mono
                      value={
                        device.cell_info?.sci_ca_info
                          ? device.cell_info.sci_ca_info.split(";").join("\n")
                          : "N/A"
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Signal + Uptime side by side */}
          <div className="flex flex-row flex-wrap gap-6 items-stretch w-full">
            <div className="flex-1 basis-1/2 min-w-0">
              <Card className="h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    Signal Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-6">
                  <InfoRow label="Signal Strength" value={toTitle(device.port.spt_signal, "N/A")} />
                  <InfoRow label="Band" value={toTitle(device.port.spt_band, "N/A")} />
                  <InfoRow label="Operator" value={toTitle(device.port.spt_operator, "N/A")} />
                  {device.cell_info && (
                    <>
                      <InfoRow label="RAT" value={toTitle(device.cell_info.sci_rat, "N/A")} />
                      <InfoRow label="EN-DC Active" value={device.cell_info.sci_endc_active ? "Yes" : "No"} />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 basis-1/2 min-w-0">
              <Card className="h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading.uptime ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading uptime...</span>
                    </div>
                  ) : uptimeData ? (
                    <div className="space-y-2">
                      <InfoRow label="Uptime" value={uptimeData.uptime_formatted || `${uptimeData.uptime ?? "N/A"}`} />
                      <InfoRow label="Last Restart" value={uptimeData.last_restart || "N/A"} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Uptime data unavailable</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Connections ─── */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Connections
                  {connectionCount !== null && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {connectionCount} device{connectionCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading.connections ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading connections...</span>
                </div>
              ) : connectedDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No connected devices</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Devices will appear here when they connect to this hotspot</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>Hostname</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectedDevices.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{d.ip || "N/A"}</TableCell>
                        <TableCell className="font-mono text-sm">{d.mac || "N/A"}</TableCell>
                        <TableCell>{d.hostname || "Unknown"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Cellular ─── */}
        <TabsContent value="cellular" className="space-y-6">
          {/* M1 Module Info */}
          {m1Info && !loading.m1Info && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  M1 Module Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(m1Info).map(([key, val]) => (
                  <InfoRow key={key} label={key} value={String(val ?? "N/A")} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Serving Cell History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Serving Cell History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.servingCell ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading cell history...</span>
                </div>
              ) : servingCellHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Signal className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No serving cell history</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Cell ID</TableHead>
                        <TableHead>RAT</TableHead>
                        <TableHead>Band</TableHead>
                        <TableHead>Signal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servingCellHistory.map((r, i) => (
                        <TableRow key={r.id ?? i}>
                          <TableCell>{r.sci_time ? formatUnixSeconds(r.sci_time) : r.time || "N/A"}</TableCell>
                          <TableCell>{r.sci_operator ?? r.operator ?? "N/A"}</TableCell>
                          <TableCell className="font-mono">{r.sci_cellid ?? r.cell_id ?? "N/A"}</TableCell>
                          <TableCell>{r.sci_rat ?? r.rat ?? "N/A"}</TableCell>
                          <TableCell>{r.sci_band ?? r.band ?? "N/A"}</TableCell>
                          <TableCell>{r.sci_signal ?? r.signal ?? "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {servingCellTotal > 10 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={servingCellPage <= 1}
                        onClick={() => loadServingCellPage(servingCellPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {servingCellPage} of {Math.ceil(servingCellTotal / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={servingCellPage >= Math.ceil(servingCellTotal / 10)}
                        onClick={() => loadServingCellPage(servingCellPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* SIM Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">SIM Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.simActivity ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading SIM activity...</span>
                </div>
              ) : simActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ScanLine className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No SIM activity recorded</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simActivity.map((a, i) => (
                        <TableRow key={a.id ?? i}>
                          <TableCell>{a.action || "N/A"}</TableCell>
                          <TableCell>
                            {a.timestamp
                              ? new Date(a.timestamp).toLocaleString()
                              : a.created_at
                              ? new Date(a.created_at).toLocaleString()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {simActivityTotal > 10 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={simActivityPage <= 1}
                        onClick={() => loadSimActivityPage(simActivityPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {simActivityPage} of {Math.ceil(simActivityTotal / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={simActivityPage >= Math.ceil(simActivityTotal / 10)}
                        onClick={() => loadSimActivityPage(simActivityPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
