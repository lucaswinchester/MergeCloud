const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function getDeviceConfig(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get config: ${res.status}`);
  return res.json();
}

export async function setDeviceConfig(
  uuid: string,
  config: { ssid?: string; password?: string; logo_file?: File | Blob },
  apiKey?: string
) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config`;

  const formData = new FormData();
  if (config.ssid) formData.append("ssid", config.ssid);
  if (config.password) formData.append("password", config.password);
  if (config.logo_file) formData.append("logo_file", config.logo_file);

  const headers: Record<string, string> = {};
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to set config: ${res.status}`);
  return res.json();
}

export async function resetToFactoryDefaults(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/default-config`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/default_config`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to reset to factory defaults: ${res.status}`);
  return res.json();
}

export async function setLanIP(uuid: string, body: { lan_ip: string }, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/set-lan-ip`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/set_lan_ip`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to set LAN IP: ${res.status}`);
  return res.json();
}
