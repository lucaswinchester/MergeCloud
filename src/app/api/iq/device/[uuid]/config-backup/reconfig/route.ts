import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config_backup/reconfig`,
  upstreamMethod: "POST",
  requirePermission: "canConfigBackup",
});
