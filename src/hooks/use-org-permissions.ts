"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "@clerk/nextjs";

export interface OrgPermissions {
  isRetailer: boolean;
  isWholesaler: boolean;
  sparqfiPermissions: Record<string, boolean>;
  hasApiKey: boolean;
  hasDeviceAccess: boolean;
}

export function useOrgPermissions() {
  const { organization } = useOrganization();
  const [permissions, setPermissions] = useState<OrgPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!organization?.id) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/org/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      } else {
        setPermissions(null);
      }
    } catch {
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    hasApiKey: permissions?.hasApiKey ?? false,
    refresh: fetchPermissions,
  };
}
