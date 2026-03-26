import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/bridged_ip/create_rule/${p.serial}`,
  upstreamMethod: "POST",
  forwardBody: true,
  requirePermission: "canBridgedIp",
});
