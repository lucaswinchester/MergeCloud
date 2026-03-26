import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/set_lan_ip`,
  upstreamMethod: "POST",
  forwardBody: true,
});
