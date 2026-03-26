import { createSparqfiProxy } from "@/lib/sparqfi-proxy";

export const GET = createSparqfiProxy({
  authMode: "platform",
  buildUrl: (_p, searchParams) => {
    const size = searchParams.get("size") ?? "100";
    const page = searchParams.get("page") ?? "1";
    const q = searchParams.get("q") ?? "";

    const params = new URLSearchParams();
    params.set("size", size);
    if (q) {
      params.set("q", q);
    } else {
      params.set("page", page);
    }

    return `/devices?${params.toString()}`;
  },
  buildScopedUrl: (_p, searchParams, ctx) => {
    const size = searchParams.get("size") ?? "100";
    const page = searchParams.get("page") ?? "1";
    const q = searchParams.get("q") ?? "";

    const params = new URLSearchParams();
    params.set("size", size);
    if (q) {
      params.set("q", q);
    } else {
      params.set("page", page);
    }

    if (ctx.isScoped && ctx.resellerUuid) {
      return `/reseller/${ctx.resellerUuid}/devices?${params.toString()}`;
    }
    return `/devices?${params.toString()}`;
  },
  upstreamMethod: "POST",
  buildBody: async (req) => {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    return JSON.stringify({ q });
  },
});
