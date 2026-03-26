import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const PUT = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/update`,
  upstreamMethod: "PUT",
  forwardBody: true,
});
