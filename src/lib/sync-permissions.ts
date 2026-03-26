import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

/**
 * Syncs SparqFi feature permissions for an organization.
 * Calls the SparqFi API to get the reseller's feature flags
 * and updates the organizationSettings record.
 */
export async function syncSparqfiPermissions(
  clerkOrgId: string,
  apiKey: string
): Promise<Record<string, boolean>> {
  // Call SparqFi API to get reseller permissions/features
  const response = await fetch(`${API_BASE_URL}/reseller/permissions`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": apiKey,
    },
    cache: "no-store",
  });

  let permissions: Record<string, boolean> = {};

  if (response.ok) {
    const data = await response.json();
    // Map API response to our permission flags
    permissions = {
      canActivate: Boolean(data?.can_activate ?? data?.canActivate ?? true),
      canDeactivate: Boolean(data?.can_deactivate ?? data?.canDeactivate ?? true),
      canUpdateFirmware: Boolean(data?.can_update_firmware ?? data?.canUpdateFirmware ?? false),
      canPortForward: Boolean(data?.can_port_forward ?? data?.canPortForward ?? false),
      canDedicatedIp: Boolean(data?.can_dedicated_ip ?? data?.canDedicatedIp ?? false),
      canBridgedIp: Boolean(data?.can_bridged_ip ?? data?.canBridgedIp ?? false),
      canConfigBackup: Boolean(data?.can_config_backup ?? data?.canConfigBackup ?? false),
      canViewReports: Boolean(data?.can_view_reports ?? data?.canViewReports ?? false),
    };
  } else {
    // If the permissions endpoint doesn't exist or fails,
    // default to allowing basic operations
    console.warn(
      `Failed to sync permissions for org ${clerkOrgId}: ${response.status}. Using defaults.`
    );
    permissions = {
      canActivate: true,
      canDeactivate: true,
      canUpdateFirmware: true,
      canPortForward: true,
      canDedicatedIp: true,
      canBridgedIp: true,
      canConfigBackup: true,
      canViewReports: true,
    };
  }

  // Update the database
  await db
    .update(organizationSettings)
    .set({
      sparqfiPermissions: permissions,
      lastPermissionSync: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(organizationSettings.clerkOrgId, clerkOrgId));

  return permissions;
}
