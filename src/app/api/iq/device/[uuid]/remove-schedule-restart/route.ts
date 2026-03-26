import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/remove_schedule_restart`,
  upstreamMethod: "POST",
  forwardBody: true,
});
