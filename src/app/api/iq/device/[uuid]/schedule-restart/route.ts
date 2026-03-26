import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/schedule_restart`,
  upstreamMethod: "POST",
  forwardBody: true,
});
