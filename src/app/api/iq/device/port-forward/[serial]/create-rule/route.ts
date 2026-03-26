import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/port_forward/create_rule/${p.serial}`,
  upstreamMethod: "POST",
  forwardBody: true,
  requirePermission: "canPortForward",
});
