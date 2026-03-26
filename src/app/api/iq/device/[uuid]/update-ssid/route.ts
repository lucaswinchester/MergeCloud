import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/update_ssid`,
  upstreamMethod: "POST",
  forwardBody: true,
});
