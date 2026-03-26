const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

function getHeaders(isBrowser: boolean, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  return headers;
}

export async function createConfigBackup(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/create`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/create`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to create backup: ${res.status}`);
  return res.json();
}

export async function uploadConfigBackup(uuid: string, file: File, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/upload`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/upload`;

  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const res = await fetch(url, { method: "POST", headers, body: formData, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to upload backup: ${res.status}`);
  return res.json();
}

export async function uploadPFRulesBackup(uuid: string, file: File, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/upload-pf-rules`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/upload_pf_rules`;

  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const res = await fetch(url, { method: "POST", headers, body: formData, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to upload PF rules backup: ${res.status}`);
  return res.json();
}

export async function listConfigBackups(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/list`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/list`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list backups: ${res.status}`);
  return res.json();
}

export async function getPFRulesBackup(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/pf-rules`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/pf_rules`;
  const res = await fetch(url, { headers: getHeaders(isBrowser, apiKey), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get PF rules backup: ${res.status}`);
  return res.json();
}

export async function restorePFRules(uuid: string, backupData: unknown, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/pf-rules`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/pf_rules`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(backupData),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to restore PF rules: ${res.status}`);
  return res.json();
}

export async function reapplyConfig(uuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(uuid)}/config-backup/reconfig`
    : `${API_BASE_URL}/device/${encodeURIComponent(uuid)}/config_backup/reconfig`;
  const headers = { ...getHeaders(isBrowser, apiKey), "Content-Type": "application/json" };
  const res = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to reapply config: ${res.status}`);
  return res.json();
}
