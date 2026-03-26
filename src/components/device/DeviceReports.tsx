'use client';

import { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataUsageChart } from '@/components/charts/data-usage-chart';
import {
  fetchNetScanHistory,
  fetchSpeedTestHistory,
  fetchDeviceHistory,
  fetchDataUsageHistory,
  fetchActionReport,
  fetchIPReport,
} from '@/server/reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SpeedTestResult } from '@/types/speedtest';
import { NetScanResult } from '@/types/netscan';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportProps {
  deviceUuid: string;
}

interface DataUsageRecord {
  id: number;
  used_data: number;
  last_updated_at: string;
  cycle: {
    month: number;
    year: number;
  };
}

interface DeviceHistory {
  id: number;
  device_id: number;
  action: string;
  old_value: string;
  new_value: string;
  created_at: string;
  taken_by: {
    id: number;
    full_name: string;
  } | null;
}

interface ActionReportRow {
  id?: number;
  timestamp?: string;
  created_at?: string;
  action?: string;
  device_uuid?: string;
  device_name?: string;
  details?: string;
  description?: string;
}

interface IPReportRow {
  id?: number;
  ip?: string;
  device_uuid?: string;
  device_name?: string;
  start_date?: string;
  end_date?: string;
}


export function DeviceReports({ deviceUuid }: ReportProps) {
  const [activeTab, setActiveTab] = useState('network');

  // Loading and error states
  const [loading, setLoading] = useState({
    deviceHistory: true,
    netScan: true,
    speedTest: true,
    usage: true,
  });

  const [error, setError] = useState({
    deviceHistory: '',
    netScan: '',
    speedTest: '',
    usage: '',
  });

  // Data states
  const [netScanData, setNetScanData] = useState<NetScanResult[]>([]);
  const [speedTestData, setSpeedTestData] = useState<SpeedTestResult[]>([]);
  const [deviceHistoryData, setDeviceHistoryData] = useState<DeviceHistory[]>([]);
  const [usageData, setUsageData] = useState<DataUsageRecord[]>([]);
  
  // State for the network scan details modal
  const [selectedScan, setSelectedScan] = useState<NetScanResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const loadNetScanData = async () => {
      try {
        const response = await fetchNetScanHistory(deviceUuid);
        // Expecting { cells: NetScanResult[] }
        const data: NetScanResult[] = response?.cells ?? [];
        setNetScanData(data);
        setError((prev) => ({ ...prev, netScan: '' }));
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error loading net scan data:', err);
        setError((prev) => ({
          ...prev,
          netScan: `Failed to load network scan data: ${errorMessage}`,
        }));
        setNetScanData([]);
      } finally {
        setLoading((prev) => ({ ...prev, netScan: false }));
      }
    };

    const loadSpeedTestData = async () => {
      try {
        const data = await fetchSpeedTestHistory(deviceUuid);
        if (!Array.isArray(data)) {
          console.error('Expected array but received:', data);
          setSpeedTestData([]);
          setError((prev) => ({
            ...prev,
            speedTest: 'Invalid data format received from server',
          }));
          return;
        }
        setSpeedTestData(data);
        setError((prev) => ({ ...prev, speedTest: '' }));
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error loading speed test data:', err);
        setError((prev) => ({
          ...prev,
          speedTest: `Failed to load speed test data: ${errorMessage}`,
        }));
      } finally {
        setLoading((prev) => ({ ...prev, speedTest: false }));
      }
    };

    const loadDeviceHistory = async () => {
      try {
        const data = await fetchDeviceHistory(deviceUuid);
        setDeviceHistoryData(data);
        setError((prev) => ({ ...prev, deviceHistory: '' }));
      } catch (err: unknown) {
        console.error('Error loading device history:', err);
        setError((prev) => ({
          ...prev,
          deviceHistory: 'Failed to load device history',
        }));
      } finally {
        setLoading((prev) => ({ ...prev, deviceHistory: false }));
      }
    };

    const loadUsageData = async () => {
      try {
        const response = await fetchDataUsageHistory(deviceUuid);
        // Expecting { items: DataUsageRecord[] }
        const items: DataUsageRecord[] = response?.items ?? [];
        setUsageData(items);
        setError((prev) => ({ ...prev, usage: '' }));
      } catch (err: unknown) {
        console.error('Error in loadUsageData:', err);
        setError((prev) => ({
          ...prev,
          usage: 'Failed to load data usage history',
        }));
      } finally {
        setLoading((prev) => ({ ...prev, usage: false }));
      }
    };

    loadNetScanData();
    loadSpeedTestData();
    loadDeviceHistory();
    loadUsageData();
  }, [deviceUuid]);

  const formatUnixSeconds = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const parseNetScanText = (nsrText: string | undefined, refOpToName: Record<string, string>) => {
    if (!nsrText) return [] as Array<{ ref_op: string; rat: string; band: string; signal: string; op_name: string }>;

    const lines = nsrText.split(/\r?\n/);
    const results: Array<{ ref_op: string; rat: string; band: string; signal: string; op_name: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line.includes('QSCAN:')) continue;

      const match = line.match(/QSCAN:\s*"([^"]+)"\s*,\s*(.*)$/);
      if (!match) continue;

      const rat = match[1];
      if (rat !== 'NR5G') continue;

      const parts = match[2]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length < 6) continue;

      const mcc = parts[0];
      const mnc = parts[1];
      const refOp = `${mcc}${mnc}`;

      const signal = parts[4];

      const bandCandidate = parts.length >= 4 ? parts[parts.length - 4] : '';
      const band = bandCandidate ? String(bandCandidate) : '';

      results.push({
        ref_op: refOp,
        rat,
        band,
        signal,
        op_name: refOpToName[refOp] ?? refOp,
      });
    }

    return results;
  };

  const getNetworksForScan = (scan: NetScanResult) => {
    const fromJson: Array<{ ref_op: string; rat: string; band: string; signal: string; op_name: string }> =
      Array.isArray(scan?.nsr_json) ? scan.nsr_json : [];

    const refOpToName = fromJson.reduce<Record<string, string>>((acc, n) => {
      if (n?.ref_op && n?.op_name) acc[String(n.ref_op)] = String(n.op_name);
      return acc;
    }, {});

    const hasNr5g = fromJson.some((n) => String(n?.rat ?? '').toUpperCase() === 'NR5G');
    const fromText = hasNr5g ? [] : parseNetScanText(scan?.nsr_text, refOpToName);

    const combined = [...fromJson, ...fromText];
    const seen = new Set<string>();
    const unique = combined.filter((n) => {
      const key = `${n.ref_op}|${n.rat}|${n.band}|${n.signal}|${n.op_name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const parseSignal = (value: unknown) => {
      const num = Number(String(value ?? '').trim());
      return Number.isFinite(num) ? num : null;
    };

    return unique.sort((a, b) => {
      const sa = parseSignal(a.signal);
      const sb = parseSignal(b.signal);

      if (sa === null && sb === null) return 0;
      if (sa === null) return 1;
      if (sb === null) return -1;

      return sb - sa;
    });
  };

  const renderSpeedTestTable = () => {
    if (loading.speedTest) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    }

    if (error.speedTest) {
      return <p className="text-red-500">{error.speedTest}</p>;
    }

    if (speedTestData.length === 0) {
      return (
        <p className="text-muted-foreground">
          No speed test data available
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Download</TableHead>
              <TableHead>Upload</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Jitter</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Primary Band</TableHead>
              <TableHead>Secondary Bands</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {speedTestData.map((test) => {
              const testType =
                test.str_type === 1
                  ? 'Normal'
                  : test.str_type === 2
                  ? 'Rapid'
                  : `Unknown (${test.str_type})`;

              let latency: number | undefined =
                test.LATENCY ?? undefined;
              let jitter: number | undefined =
                test.JITTER ?? undefined;

              if (latency === undefined || jitter === undefined) {
                const latencyMatch = test.str_text?.match(/LATENCY=(\d+)/);
                const jitterMatch = test.str_text?.match(/JITTER=(\d+)/);
                latency = latencyMatch
                  ? parseInt(latencyMatch[1], 10)
                  : undefined;
                jitter = jitterMatch
                  ? parseInt(jitterMatch[1], 10)
                  : undefined;
              }

              const primaryBand = test.pcc_band
                ? String(test.pcc_band).toUpperCase()
                : 'N/A';
              const signalMatch =
                test.str_text?.match(/SIGNAL=([-\d.]+)dbm/i) ?? null;
              const primaryStrength =
                test.pcc_strength ??
                (signalMatch ? `${signalMatch[1]} dBm` : 'N/A');

              const secondaryBands =
                test.scc_band_info?.map((scc: { band: string; strength: string }) => ({
                  band: String(scc.band).toUpperCase(),
                  strength: scc.strength || 'N/A',
                })) ?? [];

              const testStatus =
                test.str_result === 2
                  ? 'Success'
                  : test.str_result === 4
                  ? 'Failed'
                  : `Error (${test.str_result})`;

              let errorMessage = '';
              if (test.str_result !== 2) {
                const errorMatch = test.str_text?.match(/ERROR:([^\n]+)/);
                errorMessage = errorMatch
                  ? errorMatch[1].trim()
                  : test.str_text
                  ? test.str_text
                      .split('\n')
                      .find((line: string) => line.includes('ERROR:')) ?? ''
                  : '';
              }

              return (
                <TableRow key={test.id}>
                  <TableCell>{formatUnixSeconds(test.str_time)}</TableCell>
                  <TableCell>{testType}</TableCell>
                  <TableCell>
                    {test.download_speed
                      ? `${test.download_speed} Mbps`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {test.upload_speed
                      ? `${test.upload_speed} Mbps`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {latency !== undefined ? `${latency} ms` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {jitter !== undefined ? `${jitter} ms` : 'N/A'}
                  </TableCell>
                  <TableCell>{test.carrier || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{primaryBand}</span>
                      <span className="text-xs text-muted-foreground">
                        {primaryStrength}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {secondaryBands.length > 0 ? (
                      <div className="space-y-1">
                        {secondaryBands.map((scc, idx) => (
                          <div key={idx} className="text-sm">
                            {scc.band}:{' '}
                            <span className="text-muted-foreground">
                              {scc.strength}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      test.str_result === 2
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                    title={errorMessage}
                  >
                    {testStatus}
                    {errorMessage && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {errorMessage}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderUsageTable = () => {
    if (loading.usage) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    }

    if (error.usage) {
      return <p className="text-red-500">{error.usage}</p>;
    }

    if (usageData.length === 0) {
      return (
        <p className="text-muted-foreground">
          No data usage history available
        </p>
      );
    }

    // Prepare data for the chart (values are already in GB)
    const chartData = [...usageData]
      .reverse()
      .map((record) => ({
        name: new Date(
          record.cycle.year,
          record.cycle.month - 1
        ).toLocaleDateString('en-US', { month: 'short' }),
        usage: record.used_data, // Already in GB
        fullDate: new Date(
          record.cycle.year,
          record.cycle.month - 1
        ).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }));

    return (
      <div className="space-y-4">
        <div className="h-[300px]">
          <DataUsageChart data={chartData} />
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Data Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...usageData] // Create a new array to avoid mutating the original
                .sort((a, b) => {
                  // Sort by year and month in descending order (newest first)
                  if (a.cycle.year !== b.cycle.year) {
                    return b.cycle.year - a.cycle.year;
                  }
                  return b.cycle.month - a.cycle.month;
                })
                .map((record) => {
                  const date = new Date(record.cycle.year, record.cycle.month - 1);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  
                  return (
                    <TableRow key={`${record.cycle.year}-${record.cycle.month}`}>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>{record.used_data.toFixed(2)} GB</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderNetScanTable = () => {
    if (loading.netScan)
      return <div>Loading network scan data...</div>;
    if (error.netScan)
      return <div className="text-red-500">{error.netScan}</div>;
    if (!netScanData || netScanData.length === 0)
      return <div>No network scan data available</div>;

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Best Network</TableHead>
                <TableHead>RAT</TableHead>
                <TableHead>Band</TableHead>
                <TableHead>Signal (dBm)</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {netScanData.map((scan) => {
                const firstNetwork =
                  Array.isArray(scan.nsr_json) && scan.nsr_json.length > 0
                    ? scan.nsr_json[0]
                    : null;

                const bestNetwork = (() => {
                  if (scan.best_result) {
                    return {
                      refop: scan.best_result.refop,
                      rat: scan.best_result.rat,
                      band: scan.best_result.band,
                      signal: scan.best_result.signal,
                      operator_name: scan.best_result.operator_name,
                    };
                  }
                  if (firstNetwork) {
                    return {
                      refop: firstNetwork.ref_op,
                      rat: firstNetwork.rat,
                      band: firstNetwork.band,
                      signal: firstNetwork.signal,
                      operator_name: firstNetwork.op_name,
                    };
                  }
                  return null;
                })();

                return (
                  <TableRow 
                    key={scan.id}
                    onClick={() => {
                      setSelectedScan(scan);
                      setIsModalOpen(true);
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>
                      {formatUnixSeconds(scan.nsr_time)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          scan.nsr_result === 2
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {scan.nsr_result === 2 ? 'Success' : 'Partial'}
                      </span>
                    </TableCell>
                    <TableCell>{bestNetwork?.operator_name || 'N/A'}</TableCell>
                    <TableCell>{bestNetwork?.rat || 'N/A'}</TableCell>
                    <TableCell>{bestNetwork?.band || 'N/A'}</TableCell>
                    <TableCell>
                      {bestNetwork?.signal !== undefined &&
                      bestNetwork?.signal !== null
                        ? `${bestNetwork.signal} dBm`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{bestNetwork?.operator_name || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Network Scan Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Network Scan Details</DialogTitle>
            </DialogHeader>
            {selectedScan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Scan Time</h4>
                    <p>{formatUnixSeconds(selectedScan.nsr_time)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Status</h4>
                    <p>{selectedScan.nsr_result === 2 ? 'Success' : 'Partial'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Networks Detected</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operator</TableHead>
                          <TableHead>RAT</TableHead>
                          <TableHead>Band</TableHead>
                          <TableHead>Signal (dBm)</TableHead>
                          <TableHead>Reference OP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getNetworksForScan(selectedScan).map((network, index) => (
                          <TableRow key={`${network.ref_op}-${network.rat}-${network.band}-${network.signal}-${index}`}>
                            <TableCell>{network.op_name}</TableCell>
                            <TableCell>{network.rat}</TableCell>
                            <TableCell>{network.band}</TableCell>
                            <TableCell>{network.signal}</TableCell>
                            <TableCell>{network.ref_op}</TableCell>
                          </TableRow>
                        ))}
                        {getNetworksForScan(selectedScan).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No network data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {selectedScan.best_result && (
                  <div>
                    <h3 className="font-medium mb-2">Best Network</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Operator</h4>
                          <p>{selectedScan.best_result.operator_name}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">RAT</h4>
                          <p>{selectedScan.best_result.rat}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Band</h4>
                          <p>{selectedScan.best_result.band}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Signal</h4>
                          <p>{selectedScan.best_result.signal} dBm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  };

  // Action Report state
  const [actionReportData, setActionReportData] = useState<ActionReportRow[]>([]);
  const [actionReportLoading, setActionReportLoading] = useState(false);
  const [actionReportFrom, setActionReportFrom] = useState('');
  const [actionReportTo, setActionReportTo] = useState('');

  const handleFetchActionReport = async () => {
    if (!actionReportFrom || !actionReportTo) {
      toast.error('Please select both dates');
      return;
    }
    setActionReportLoading(true);
    try {
      const data = await fetchActionReport(actionReportFrom, actionReportTo);
      setActionReportData(Array.isArray(data) ? data : data?.items ?? data?.data ?? []);
    } catch {
      toast.error('Failed to fetch action report');
    }
    setActionReportLoading(false);
  };

  // IP Report state
  const [ipReportData, setIpReportData] = useState<IPReportRow[]>([]);
  const [ipReportLoading, setIpReportLoading] = useState(false);
  const [ipReportFrom, setIpReportFrom] = useState('');
  const [ipReportTo, setIpReportTo] = useState('');

  const handleFetchIPReport = async () => {
    if (!ipReportFrom || !ipReportTo) {
      toast.error('Please select both dates');
      return;
    }
    setIpReportLoading(true);
    try {
      const data = await fetchIPReport(ipReportFrom, ipReportTo);
      setIpReportData(Array.isArray(data) ? data : data?.items ?? data?.data ?? []);
    } catch {
      toast.error('Failed to fetch IP report');
    }
    setIpReportLoading(false);
  };

  const renderDeviceHistoryTable = () => {
    if (loading.deviceHistory) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      );
    }

    if (error.deviceHistory) {
      return <p className="text-red-500">{error.deviceHistory}</p>;
    }

    if (!deviceHistoryData || deviceHistoryData.length === 0) {
      return (
        <p className="text-muted-foreground">
          No device history available
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Changed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceHistoryData.map((history) => (
                <TableRow key={history.id}>
                  <TableCell>
                    {new Date(history.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{history.action}</TableCell>
                  <TableCell>{history.old_value || 'N/A'}</TableCell>
                  <TableCell>{history.new_value || 'N/A'}</TableCell>
                  <TableCell>
                    {history.taken_by?.full_name || 'System'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Tabs
        defaultValue="network"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="network">Network Scan</TabsTrigger>
          <TabsTrigger value="speed-tests">Speed Tests</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="device-history">Device History</TabsTrigger>
          <TabsTrigger value="action-report">Action Report</TabsTrigger>
          <TabsTrigger value="ip-report">IP Report</TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Scan Results</CardTitle>
            </CardHeader>
            <CardContent>{renderNetScanTable()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speed-tests">
          <Card>
            <CardHeader>
              <CardTitle>Speed Test History</CardTitle>
            </CardHeader>
            <CardContent>{renderSpeedTestTable()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent>{renderUsageTable()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device-history">
          <Card>
            <CardHeader>
              <CardTitle>Device History</CardTitle>
            </CardHeader>
            <CardContent>{renderDeviceHistoryTable()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action-report">
          <Card>
            <CardHeader>
              <CardTitle>Action Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="space-y-1">
                    <Label className="text-xs">From Date</Label>
                    <Input type="date" value={actionReportFrom} onChange={(e) => setActionReportFrom(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To Date</Label>
                    <Input type="date" value={actionReportTo} onChange={(e) => setActionReportTo(e.target.value)} className="w-40" />
                  </div>
                  <Button onClick={handleFetchActionReport} disabled={actionReportLoading}>
                    {actionReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                  </Button>
                </div>
                {actionReportData.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {actionReportData.map((row, i) => (
                          <TableRow key={row.id ?? i}>
                            <TableCell>{row.timestamp ? new Date(row.timestamp).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell>{row.action || 'N/A'}</TableCell>
                            <TableCell>{row.device_uuid || row.device_name || 'N/A'}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{row.details || row.description || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {actionReportData.length === 0 && !actionReportLoading && (
                  <p className="text-sm text-muted-foreground">Select a date range and click Generate to view the action report.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip-report">
          <Card>
            <CardHeader>
              <CardTitle>IP Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={ipReportFrom} onChange={(e) => setIpReportFrom(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={ipReportTo} onChange={(e) => setIpReportTo(e.target.value)} className="w-40" />
                  </div>
                  <Button onClick={handleFetchIPReport} disabled={ipReportLoading}>
                    {ipReportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                  </Button>
                </div>
                {ipReportData.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ipReportData.map((row, i) => (
                          <TableRow key={row.id ?? i}>
                            <TableCell className="font-mono">{row.ip || 'N/A'}</TableCell>
                            <TableCell>{row.device_uuid || row.device_name || 'N/A'}</TableCell>
                            <TableCell>{row.start_date ? new Date(row.start_date).toLocaleString() : 'N/A'}</TableCell>
                            <TableCell>{row.end_date ? new Date(row.end_date).toLocaleString() : 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {ipReportData.length === 0 && !ipReportLoading && (
                  <p className="text-sm text-muted-foreground">Select a date range and click Generate to view the IP report.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}