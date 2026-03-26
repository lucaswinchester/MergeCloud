import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/port_forward/get_rules/${p.serial}`,
  requirePermission: "canPortForward",
});
