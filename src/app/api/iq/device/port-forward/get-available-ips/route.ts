import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: () => `/device/port_forward/get_available_ips`,
  forwardSearch: true,
  requirePermission: "canPortForward",
});
