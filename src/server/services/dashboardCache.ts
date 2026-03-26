import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured, dashboardStats, type DashboardStat } from "@/db/client";
import { fetchAllDevices } from "@/server/iqapi";

interface Device {
  uuid: string;
  serial_no: string;
  label?: string;
  is_activated: boolean;
  status: number;
  used_data: number;
  device_plan?: string;
  created_at?: string;
  last_updated_at?: string;
}

interface MonthlyData {
  name: string;
  total: number;
}

interface DashboardData {
  totalDevices: number;
  devicesActive: number;
  devicesOnline: number;
  devicesOverData: number;
  totalDataUsage: number;
  monthlyActivations: MonthlyData[];
  topDataUsers: Array<{
    uuid: string;
    label: string;
    serialNo: string;
    usedData: number;
  }>;
  lastCalculatedAt: Date;
  isCached: boolean;
}

// Cache validity period (5 minutes)
const CACHE_VALIDITY_MS = 5 * 60 * 1000;

// Calculate monthly activations from devices
function calculateMonthlyActivations(devices: Device[]): MonthlyData[] {
  const now = new Date();
  const months: MonthlyData[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });

    const count = devices.filter((d: Device) => {
      if (!d.created_at && !d.last_updated_at) return false;
      const deviceDate = new Date(d.created_at || d.last_updated_at || "");
      return (
        deviceDate.getMonth() === date.getMonth() &&
        deviceDate.getFullYear() === date.getFullYear() &&
        d.is_activated
      );
    }).length;

    months.push({ name: monthName, total: count });
  }

  return months;
}

// Calculate dashboard statistics from devices
function calculateStatsFromDevices(devices: Device[]): Omit<DashboardData, "isCached"> {
  const totalDevices = devices.length;
  const devicesActive = devices.filter((d) => d.is_activated).length;
  const devicesOnline = devices.filter((d) => d.status === 1).length;
  const devicesOverData = devices.filter((d) => {
    const usedGB = d.used_data / (1024 * 1024);
    return usedGB > 50;
  }).length;

  const totalDataUsage = devices.reduce((sum, d) => sum + (d.used_data || 0), 0);

  const monthlyActivations = calculateMonthlyActivations(devices);

  // Get top 5 data users
  const topDataUsers = [...devices]
    .sort((a, b) => (b.used_data || 0) - (a.used_data || 0))
    .slice(0, 5)
    .map((d) => ({
      uuid: d.uuid,
      label: d.label || "",
      serialNo: d.serial_no,
      usedData: d.used_data || 0,
    }));

  return {
    totalDevices,
    devicesActive,
    devicesOnline,
    devicesOverData,
    totalDataUsage,
    monthlyActivations,
    topDataUsers,
    lastCalculatedAt: new Date(),
  };
}

// Get cached dashboard stats or fetch fresh data
export async function getDashboardStats(organizationId: string): Promise<DashboardData> {
  // If database is not configured, fall back to API fetch
  if (!isDatabaseConfigured()) {
    const devices = await fetchAllDevices();
    return {
      ...calculateStatsFromDevices(devices),
      isCached: false,
    };
  }

  try {
    const db = getDb();

    // Try to get cached stats
    const cachedStats = await db
      .select()
      .from(dashboardStats)
      .where(eq(dashboardStats.organizationId, organizationId))
      .limit(1);

    if (cachedStats.length > 0) {
      const cached = cachedStats[0];
      const age = Date.now() - new Date(cached.lastCalculatedAt!).getTime();

      // If cache is still valid, return it
      if (age < CACHE_VALIDITY_MS) {
        return {
          totalDevices: cached.totalDevices || 0,
          devicesActive: cached.devicesActive || 0,
          devicesOnline: cached.devicesOnline || 0,
          devicesOverData: cached.devicesOverData || 0,
          totalDataUsage: cached.totalDataUsage || 0,
          monthlyActivations: (cached.monthlyActivations as MonthlyData[]) || [],
          topDataUsers: (cached.topDataUsers as DashboardData["topDataUsers"]) || [],
          lastCalculatedAt: new Date(cached.lastCalculatedAt!),
          isCached: true,
        };
      }
    }

    // Cache is stale or doesn't exist - refresh it
    return await refreshDashboardStats(organizationId);
  } catch (error) {
    console.error("Error getting cached dashboard stats:", error);
    // Fall back to API fetch
    const devices = await fetchAllDevices();
    return {
      ...calculateStatsFromDevices(devices),
      isCached: false,
    };
  }
}

// Force refresh dashboard stats
export async function refreshDashboardStats(organizationId: string): Promise<DashboardData> {
  // Fetch fresh data from API
  const devices = await fetchAllDevices();
  const stats = calculateStatsFromDevices(devices);

  // If database is configured, cache the results
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();

      // Upsert the stats
      await db
        .insert(dashboardStats)
        .values({
          organizationId,
          totalDevices: stats.totalDevices,
          devicesActive: stats.devicesActive,
          devicesOnline: stats.devicesOnline,
          devicesOverData: stats.devicesOverData,
          totalDataUsage: stats.totalDataUsage,
          monthlyActivations: stats.monthlyActivations,
          topDataUsers: stats.topDataUsers,
          lastCalculatedAt: stats.lastCalculatedAt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: dashboardStats.organizationId,
          set: {
            totalDevices: stats.totalDevices,
            devicesActive: stats.devicesActive,
            devicesOnline: stats.devicesOnline,
            devicesOverData: stats.devicesOverData,
            totalDataUsage: stats.totalDataUsage,
            monthlyActivations: stats.monthlyActivations,
            topDataUsers: stats.topDataUsers,
            lastCalculatedAt: stats.lastCalculatedAt,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error caching dashboard stats:", error);
      // Continue even if caching fails
    }
  }

  return {
    ...stats,
    isCached: false,
  };
}
