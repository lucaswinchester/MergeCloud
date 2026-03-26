import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/port_forward/delete_rule/${p.serial}/${p.ruleId}`,
  upstreamMethod: "POST",
  requirePermission: "canPortForward",
});
