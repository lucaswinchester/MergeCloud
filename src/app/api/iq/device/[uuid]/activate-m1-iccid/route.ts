import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/activate_m1_iccid`,
  upstreamMethod: "POST",
  forwardBody: true,
});
