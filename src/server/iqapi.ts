const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

export interface PortGroup {
  created_at: string;
  last_updated_at: string;
  uuid: string;
  name: string;
  id: string;
  is_assigned: boolean;
}

export async function fetchPortGroups(apiKey?: string): Promise<PortGroup[]> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? `/api/iq/port-groups` : `${API_BASE_URL}/port-groups`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch port groups: ${response.status} ${response.statusText} ${text}`
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function changeDevicePortGroup(deviceUuid: string, portGroupUuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";

  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/change-port-group?port_group_uuid=${encodeURIComponent(portGroupUuid)}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/change-port-group?port_group_uuid=${encodeURIComponent(portGroupUuid)}`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to change port group: ${response.status} ${response.statusText} ${text}`
    );
  }

  return await response.json();
}

// Notes API functions
export async function createNote(deviceId: string, noteData: string, apiKey?: string) {
  const body = JSON.stringify({ notes: noteData });

  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceId)}/notes`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceId)}/notes`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to create note: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
}

type SlimNote = {
  notes: string;
  user_full_name: string;
  created_at: string;
};

export async function fetchNotes(deviceId?: string, apiKey?: string): Promise<SlimNote[]> {
  if (!deviceId || !deviceId.trim()) {
    console.error('No device ID provided to fetchNotes');
    throw new Error("Device ID is required to fetch notes");
  }

  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceId)}/notes`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceId)}/notes`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to read error response');
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch notes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Unexpected response format, expected array:', data);
      throw new Error('Invalid notes data format received from server');
    }

    const slim: SlimNote[] = data.map((n: any) => ({
      notes: n?.notes ?? "",
      user_full_name: n?.user?.full_name ?? "",
      created_at: n?.created_at ?? ""
    }));

    return slim;
  } catch (error) {
    console.error('Error in fetchNotes:', error);
    throw error;
  }
}

export async function fetchNoteById(noteId: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  // This function only works server-side (no proxy route for individual notes)
  const url = `${API_BASE_URL}/notes/${noteId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching note ${noteId}:`, error);
    throw error;
  }
}

export async function fetchDevices(page: number, size: number, q: string = "", apiKey?: string) {
  try {
    const params: Record<string, any> = { size };

    if (!q) {
      params.page = page;
    } else {
      params.q = q;
    }

    const queryString = new URLSearchParams(params).toString();

    const isBrowser = typeof window !== "undefined";
    const url = isBrowser
      ? `/api/iq/devices?${queryString}`
      : `${API_BASE_URL}/devices?${queryString}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!isBrowser) {
      if (!apiKey) throw new Error("API key is required for server-side calls.");
      headers["X-API-KEY"] = apiKey;
    }

    const response = await fetch(url, {
      method: isBrowser ? "GET" : "POST",
      headers,
      ...(isBrowser
        ? {}
        : {
            body: JSON.stringify({ q }),
          }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch devices: ${response.status} ${response.statusText}. ${text}`
      );
    }

    const data = await response.json();

    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

    const total = typeof data?.total === "number" ? data.total : items.length;
    const respPage = typeof data?.page === "number" ? data.page : page;
    const respSize = typeof data?.size === "number" ? data.size : size;

    return {
      data: items,
      total,
      page: respPage,
      size: respSize,
    };
  } catch (error) {
    console.error("Error fetching devices:", error);
    return { data: [], total: 0, page, size: size };
  }
}

// Fetch all devices for dashboard statistics
export async function fetchAllDevices(apiKey?: string) {
  try {
    const result = await fetchDevices(1, 10000, "", apiKey);
    return result.data;
  } catch (error) {
    console.error("Error fetching all devices:", error);
    return [];
  }
}

export async function fetchDeviceById(deviceId: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  const url = `${API_BASE_URL}/devices/${deviceId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch device with ID ${deviceId}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error);
    throw error;
  }
}


export async function fetchDeviceInfo(deviceUuid: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/info`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/info`;

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
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch device info for UUID ${deviceUuid}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching device info ${deviceUuid}:`, error);
    throw error;
  }
}

export async function updateLabel(deviceId: string, label: string, apiKey?: string) {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceId)}/update`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceId)}/update`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({ "label": label }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update device label ${deviceId}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating device ${deviceId}:`, error);
    throw error;
  }
}

export interface DevicePlan {
  plan_uuid: string;
  name: string;
}

export async function fetchDevicePlans(apiKey?: string): Promise<DevicePlan[]> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? `/api/iq/device-plans` : `${API_BASE_URL}/device-plans`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch device plans: ${response.status} ${response.statusText} ${text}`
      );
    }

    const data = await response.json();
    const arr = Array.isArray(data) ? data : [];
    return arr
      .map((p: any) => ({
        plan_uuid: String(p?.plan_uuid ?? p?.uuid ?? ""),
        name: String(p?.name ?? ""),
      }))
      .filter((p: DevicePlan) => Boolean(p.plan_uuid) && Boolean(p.name));
  } catch (error) {
    console.error("Error fetching device plans:", error);
    throw error;
  }
}

export async function updateDevicePlan(deviceUuid: string, planUuid: string, apiKey?: string): Promise<{ success: boolean }> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/change-device-plan?plan_uuid=${encodeURIComponent(planUuid)}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/change-device-plan?plan_uuid=${encodeURIComponent(planUuid)}`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to update device plan: ${response.status} ${response.statusText} ${text}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating device plan:", error);
    throw error;
  }
}

// Device control actions
export async function restartDevice(deviceUuid: string, apiKey?: string): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/restart`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/restart`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to restart device: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error restarting device:", error);
    throw error;
  }
}

export async function triggerSpeedTest(deviceUuid: string, testType: 1 | 2 = 1, apiKey?: string): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/speed-test?speed_test_type=${testType}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/speed-test?speed_test_type=${testType}`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to trigger speed test: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error triggering speed test:", error);
    throw error;
  }
}

export async function triggerNetworkScan(deviceUuid: string, apiKey?: string): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/net-scan`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/start-net-scan`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to trigger network scan: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error triggering network scan:", error);
    throw error;
  }
}

export interface ScheduleRestartRequest {
  frequency: string;
  time: string;
  day?: number;
}

export async function scheduleDeviceRestart(
  deviceUuid: string,
  schedule: ScheduleRestartRequest,
  apiKey?: string
): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/schedule-restart`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/schedule_restart`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(schedule),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to schedule device restart: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error scheduling device restart:", error);
    throw error;
  }
}

// Install uptime-restart script on device
export async function installUptimeRestart(deviceUuid: string, apiKey?: string): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/install-uptime-restart`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/install_uptime_restart`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to install uptime-restart: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error installing uptime-restart:", error);
    throw error;
  }
}

// Update device SSID
export interface UpdateSSIDRequest {
  ssid: string;
  password?: string;
}

export async function updateDeviceSSID(
  deviceUuid: string,
  ssidConfig: UpdateSSIDRequest,
  apiKey?: string
): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/update-ssid`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/update_ssid`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(ssidConfig),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to update SSID: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating SSID:", error);
    throw error;
  }
}

// Reset device configuration
export async function resetDeviceConfig(deviceUuid: string, apiKey?: string): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/reset-config`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/reset_config`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to reset device config: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error resetting device config:", error);
    throw error;
  }
}

// Update device MTU
export interface UpdateMTURequest {
  mtu: number;
}

export async function updateDeviceMTU(
  deviceUuid: string,
  mtuConfig: UpdateMTURequest,
  apiKey?: string
): Promise<any> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/update-mtu`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/update_mtu`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(mtuConfig),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Failed to update MTU: ${response.status} ${response.statusText} ${text}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating MTU:", error);
    throw error;
  }
}

// Activate device
export async function activateDevice(deviceUuid: string, portGroupUuid?: string, bwCustomerId?: string, apiKey?: string): Promise<unknown> {
  const isBrowser = typeof window !== "undefined";
  const params = new URLSearchParams();
  if (portGroupUuid) params.set("port_group_uuid", portGroupUuid);
  if (bwCustomerId) params.set("bw_customer_id", bwCustomerId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/activate${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/activate${qs}`;
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to activate device: ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

// Deactivate device
export async function deactivateDevice(deviceUuid: string, unassign?: boolean, apiKey?: string): Promise<unknown> {
  const isBrowser = typeof window !== "undefined";
  const qs = unassign !== undefined ? `?unassign_device_from_reseller=${unassign}` : "";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/deactivate${qs}`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/deactivate${qs}`;
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to deactivate device: ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

// Update firmware
export async function updateFirmware(deviceUuid: string, apiKey?: string): Promise<unknown> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/update-firmware`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/update_firmware`;
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to update firmware: ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

// Remove scheduled restart
export async function removeScheduleRestart(deviceUuid: string, apiKey?: string): Promise<unknown> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/iq/device/${encodeURIComponent(deviceUuid)}/remove-schedule-restart`
    : `${API_BASE_URL}/device/${encodeURIComponent(deviceUuid)}/remove_schedule_restart`;
  const headers: Record<string, string> = { "Accept": "application/json", "Content-Type": "application/json" };
  if (!isBrowser) {
    if (!apiKey) throw new Error("API key is required for server-side calls.");
    headers["X-API-KEY"] = apiKey;
  }
  const response = await fetch(url, { method: "POST", headers, cache: "no-store" });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to remove scheduled restart: ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

// Bulk restart multiple devices
export async function bulkRestartDevices(deviceUuids: string[], apiKey?: string): Promise<{
  success: string[];
  failed: string[];
}> {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const uuid of deviceUuids) {
    try {
      await restartDevice(uuid, apiKey);
      results.success.push(uuid);
    } catch (error) {
      console.error(`Failed to restart device ${uuid}:`, error);
      results.failed.push(uuid);
    }
  }

  return results;
}

// Bulk update device plans
export async function bulkUpdateDevicePlans(
  deviceUuids: string[],
  planUuid: string,
  apiKey?: string
): Promise<{
  success: string[];
  failed: string[];
}> {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const uuid of deviceUuids) {
    try {
      await updateDevicePlan(uuid, planUuid, apiKey);
      results.success.push(uuid);
    } catch (error) {
      console.error(`Failed to update plan for device ${uuid}:`, error);
      results.failed.push(uuid);
    }
  }

  return results;
}
