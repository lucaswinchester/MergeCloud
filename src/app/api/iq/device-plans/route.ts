import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  buildUrl: () => `/device-plans`,
});
