import { DedicatedIPCreate } from "@/types/device";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function fetchDedicatedIPRules(serial: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/dedicated-ip/${encodeURIComponent(serial)}/rules`
    : `${API_BASE_URL}/device/dedicated_ip/get_rules/${encodeURIComponent(serial)}`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch dedicated IP rules: ${res.status}`);
  return res.json();
}

export async function createDedicatedIPRule(serial: string, rule: DedicatedIPCreate, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/dedicated-ip/${encodeURIComponent(serial)}/create-rule`
    : `${API_BASE_URL}/device/dedicated_ip/create_rule/${encodeURIComponent(serial)}`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(rule),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to create dedicated IP rule: ${res.status}`);
  return res.json();
}

export async function recheckDedicatedIPRule(serial: string, ruleId: number, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/dedicated-ip/${encodeURIComponent(serial)}/${ruleId}/recheck`
    : `${API_BASE_URL}/device/dedicated_ip/recheck_rule/${encodeURIComponent(serial)}/${ruleId}`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to recheck rule: ${res.status}`);
  return res.json();
}

export async function deleteDedicatedIPRule(serial: string, ruleId: number, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/dedicated-ip/${encodeURIComponent(serial)}/${ruleId}/delete`
    : `${API_BASE_URL}/device/dedicated_ip/delete_rule/${encodeURIComponent(serial)}/${ruleId}`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to delete rule: ${res.status}`);
  return res.json();
}
