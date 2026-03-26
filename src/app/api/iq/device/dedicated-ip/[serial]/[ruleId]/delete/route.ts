import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/dedicated_ip/delete_rule/${p.serial}/${p.ruleId}`,
  upstreamMethod: "POST",
  requirePermission: "canDedicatedIp",
});
