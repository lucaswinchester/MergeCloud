import { SpeedTestResult } from "@/types/speedtest";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

/**
 * Fetches net scan history for a device
 * @param deviceUuid The device UUID
 * @param limit Number of records to return (default: 10)
 * @returns Promise with net scan history data
 */
export async function fetchNetScanHistory(deviceUuid: string, limit: number = 10, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/net-scan-history?limit=${encodeURIComponent(String(limit))}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/net-scan-history?limit=${encodeURIComponent(String(limit))}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch net scan history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching net scan history:', error);
    throw error;
  }
}

/**
 * Fetches speed test history for a device
 * @param deviceUuid The device UUID
 * @param limit Number of records to return (default: 10)
 * @returns Promise with speed test history data
 */
export interface SpeedTestResponse {
  start: number;
  count: number;
  total: number;
  cells: SpeedTestResult[];
}

export async function fetchSpeedTestHistory(deviceUuid: string, limit: number = 10, apiKey?: string): Promise<SpeedTestResult[]> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/speed-test-history?limit=${encodeURIComponent(String(limit))}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/speed-test-history?limit=${encodeURIComponent(String(limit))}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch speed test history: ${response.statusText}`);
    }

    const data: SpeedTestResponse = await response.json();
    return Array.isArray(data?.cells) ? data.cells : [];
  } catch (error) {
    console.error('Error fetching speed test history:', error);
    throw error;
  }
}

export interface DataUsageRecord {
  id: number;
  used_data: number;
  last_updated_at: string;
  cycle: {
    month: number;
    year: number;
  };
}

export interface DataUsageResponse {
  items: DataUsageRecord[];
  total: number;
  page: number;
  size: number;
}

interface DeviceStatsResponse {
  mfdevicestats: Array<{
    serial: string;
    mifidvcdate: string;
    daypassused: number;
    daypassfullconsumed: number;
    extrapassused: number;
    totaldataused: number;
    totaldatahsused: number;
    totaldatalsused: number;
    dpsprice: number;
    dpstype: number;
    country: number;
    devicetype: number;
    id_partition: number;
  }>;
  page: number;
  page_size: number;
  total: number;
}

export async function fetchDataUsageHistory(deviceUuid: string, limit: number = 30, apiKey?: string): Promise<DataUsageResponse> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/stats?limit=${encodeURIComponent(String(limit))}&page=1&page_size=12`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/stats?limit=${encodeURIComponent(String(limit))}&page=1&page_size=12`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data usage history: ${response.statusText}`);
    }

    const data: DeviceStatsResponse = await response.json();

    // Transform and sort the response to match the DataUsageResponse interface
    const items: DataUsageRecord[] = data.mfdevicestats
      .map((stat, index) => {
        const date = new Date(stat.mifidvcdate);
        // Convert MB to GB and round to 2 decimal places
        const usedDataInGB = Math.round((stat.totaldataused / 1024) * 100) / 100;

        return {
          id: index + 1,
          used_data: usedDataInGB,
          last_updated_at: stat.mifidvcdate,
          date: date,
          cycle: {
            month: date.getMonth() + 1,
            year: date.getFullYear()
          }
        };
      })
      // Sort by date in descending order (newest first)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      // Remove the temporary date property after sorting
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ date, ...rest }) => rest);

    return {
      items,
      total: data.total,
      page: data.page,
      size: data.page_size
    };
  } catch (error) {
    console.error('Error fetching data usage history:', error);
    throw error;
  }
}

// Fetch action report across devices
export async function fetchActionReport(fromDate: string, toDate: string, isBilling?: boolean, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const params = new URLSearchParams({ from_date: fromDate, to_date: toDate });
  if (isBilling !== undefined) params.set("is_billing_report", String(isBilling));
  const qs = params.toString();
  const url = isBrowser
    ? `/api/iq/devices/report?${qs}`
    : `${API_BASE_URL}/devices/report?${qs}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, { method: "GET", headers, next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`Failed to fetch action report: ${response.statusText}`);
  return response.json();
}

// Fetch IP report
export async function fetchIPReport(startDate: string, endDate: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const qs = `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  const url = isBrowser
    ? `/api/iq/device/ip-report?${qs}`
    : `${API_BASE_URL}/device/ip_report?${qs}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, { method: "GET", headers, next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`Failed to fetch IP report: ${response.statusText}`);
  return response.json();
}

export async function fetchDeviceHistory(deviceUuid: string, limit: number = 10, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/history?limit=${encodeURIComponent(String(limit))}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/history?limit=${encodeURIComponent(String(limit))}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch device history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching device history:', error);
    throw error;
  }
}
