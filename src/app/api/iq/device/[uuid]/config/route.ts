import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config`,
});

export const POST = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (p) => `/device/${p.uuid}/config`,
  upstreamMethod: "POST",
  forwardRawBody: true,
});
