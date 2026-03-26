import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config_backup/pf_rules`,
  requirePermission: "canConfigBackup",
});

export const PUT = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config_backup/pf_rules`,
  upstreamMethod: "PUT",
  forwardBody: true,
  requirePermission: "canConfigBackup",
});
