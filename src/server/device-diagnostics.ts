const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function fetchLatestSpeedTestResult(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/speed-test-result`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/speed-test-result`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch speed test result: ${res.status}`);
  return res.json();
}

export async function startNetDiagnostics(uuid: string, portGroupUuid?: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const qs = portGroupUuid ? `?port_group_uuid=${encodeURIComponent(portGroupUuid)}` : "";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/start-net-diag${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/start-net-diag${qs}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to start diagnostics: ${res.status}`);
  return res.json();
}

export async function fetchNetDiagResult(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/net-diag-result`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/net-diag-result`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch diagnostics result: ${res.status}`);
  return res.json();
}
