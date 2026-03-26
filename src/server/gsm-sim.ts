const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function activateGSMPort(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/activate-gsm-port`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/activate-gsm-port`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to activate GSM port: ${res.status}`);
  return res.json();
}

export async function activateM1ICCID(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/activate-m1-iccid`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/activate_m1_iccid`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to activate M1 ICCID: ${res.status}`);
  return res.json();
}
