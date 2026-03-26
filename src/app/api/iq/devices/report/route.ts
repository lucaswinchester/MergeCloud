import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  buildUrl: () => `/devices/report`,
  forwardSearch: true,
  requirePermission: "canViewReports",
});
