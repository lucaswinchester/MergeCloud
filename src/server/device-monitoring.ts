const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function fetchM1Info(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/m1-info`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/m1_info`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch M1 info: ${res.status}`);
  return res.json();
}

export async function fetchConnectionCount(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/connection-count`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/connection_count`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch connection count: ${res.status}`);
  return res.json();
}

export async function fetchConnectionDetails(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/connection-details`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/connection_details`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch connection details: ${res.status}`);
  return res.json();
}

export async function fetchServingCellInfo(uuid: string, page = 1, size = 10, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const qs = `page=${page}&size=${size}`;
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/serving-cell-info?${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/serving_cell_info?${qs}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch serving cell info: ${res.status}`);
  return res.json();
}

export async function fetchSimActivity(uuid: string, page = 1, pageSize = 10, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const qs = `page=${page}&page_size=${pageSize}`;
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/sim-activity?${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/sim_activity?${qs}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch SIM activity: ${res.status}`);
  return res.json();
}

export async function fetchDeviceUptime(uuid: string, interval?: string, timestamp?: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const params = new URLSearchParams();
  if (interval) params.set("interval", interval);
  if (timestamp) params.set("timestamp", timestamp);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/uptime${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/uptime${qs}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch uptime: ${res.status}`);
  return res.json();
}
