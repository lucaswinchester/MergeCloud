import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/bridged_ip/get_rules/${p.serial}`,
  requirePermission: "canBridgedIp",
});
