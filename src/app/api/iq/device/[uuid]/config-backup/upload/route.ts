import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config_backup/upload`,
  upstreamMethod: "POST",
  forwardRawBody: true,
  requirePermission: "canConfigBackup",
});
