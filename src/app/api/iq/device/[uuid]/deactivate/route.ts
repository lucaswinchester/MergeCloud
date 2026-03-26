import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/deactivate`,
  forwardSearch: true,
  requirePermission: "canDeactivate",
});
