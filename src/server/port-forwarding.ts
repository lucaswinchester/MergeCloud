import { PortForwardRuleCreate } from "@/types/device";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function fetchAvailableIPs(ipType?: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const qs = ipType ? `?ip_type=${encodeURIComponent(ipType)}` : "";
  const url = isBrowser
    ? `/api/iq/device/port-forward/get-available-ips${qs}`
    : `${API_BASE_URL}/device/port_forward/get_available_ips${qs}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch available IPs: ${res.status}`);
  return res.json();
}

export async function fetchPortForwardRules(serial: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/port-forward/${encodeURIComponent(serial)}/rules`
    : `${API_BASE_URL}/device/port_forward/get_rules/${encodeURIComponent(serial)}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch port forward rules: ${res.status}`);
  return res.json();
}

export async function createPortForwardRule(serial: string, rule: PortForwardRuleCreate, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/port-forward/${encodeURIComponent(serial)}/create-rule`
    : `${API_BASE_URL}/device/port_forward/create_rule/${encodeURIComponent(serial)}`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(rule),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to create rule: ${res.status}`);
  return res.json();
}

export async function deletePortForwardRule(serial: string, ruleId: number, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/port-forward/${encodeURIComponent(serial)}/${ruleId}/delete`
    : `${API_BASE_URL}/device/port_forward/delete_rule/${encodeURIComponent(serial)}/${ruleId}`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to delete rule: ${res.status}`);
  return res.json();
}
