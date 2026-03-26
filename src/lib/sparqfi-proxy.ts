import { NextRequest, NextResponse } from "next/server";
import { withOrgAuth, OrgAuthContext, withPlatformAuth, PlatformAuthContext } from "@/lib/auth";

const API_BASE_URL = "https://api.partner.sparqfi.com/api/v1";

type ProxyMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ProxyOptions {
  /**
   * Build the upstream API path from route params.
   * Params are auto-extracted from the Next.js route context and URI-encoded.
   * Return a path like `/device/${p.uuid}/info` (no base URL).
   */
  buildUrl: (
    params: Record<string, string>,
    searchParams: URLSearchParams
  ) => string;
  /** Override the upstream HTTP method (e.g. GET handler → POST upstream). */
  upstreamMethod?: ProxyMethod;
  /** Forward the incoming request body as text. */
  forwardBody?: boolean;
  /** Forward the raw body bytes (for binary/multipart uploads). */
  forwardRawBody?: boolean;
  /** Forward the incoming query string to the upstream URL. */
  forwardSearch?: boolean;
  /** SparqFi permission key required (e.g. "canActivate"). Returns 403 if missing. */
  requirePermission?: string;
  /** Custom body builder for routes that construct special payloads. */
  buildBody?: (req: NextRequest) => Promise<string | null>;
  /**
   * Auth mode: 'org' uses org-level API key (default), 'platform' uses
   * per-user scoped credentials with admin bypass.
   */
  authMode?: "org" | "platform";
  /**
   * When authMode is 'platform', optionally build a scoped URL using
   * the PlatformAuthContext (e.g. to route through /reseller/{uuid}/...).
   * Falls back to buildUrl when not provided or when user is unscoped admin.
   */
  buildScopedUrl?: (
    params: Record<string, string>,
    searchParams: URLSearchParams,
    ctx: PlatformAuthContext
  ) => string;
}

/**
 * Creates a SparqFi proxy route handler.
 *
 * Usage:
 * ```ts
 * export const GET = createSparqfiProxy({
 *   buildUrl: (p) => `/device/${p.uuid}/info`,
 * });
 * ```
 */
export function createSparqfiProxy(options: ProxyOptions) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> }
  ) => {
    const incomingMethod = (req.method as ProxyMethod) || "GET";

    // Core proxy logic shared by both auth modes
    const proxyHandler = async (
      ctx: OrgAuthContext | PlatformAuthContext,
    ) => {
      // Permission check
      if (options.requirePermission) {
        const hasPermission = ctx.permissions.sparqfi[options.requirePermission];
        if (!hasPermission) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Resolve route params
      const rawParams = routeCtx?.params ? await routeCtx.params : {};
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawParams)) {
        params[key] = encodeURIComponent(value);
      }

      const searchParams = req.nextUrl.searchParams;

      // Determine upstream path
      let upstreamPath: string;
      if (
        options.authMode === "platform" &&
        options.buildScopedUrl &&
        "isScoped" in ctx
      ) {
        upstreamPath = options.buildScopedUrl(
          params,
          searchParams,
          ctx as PlatformAuthContext
        );
      } else {
        upstreamPath = options.buildUrl(params, searchParams);
      }

      // Append query string
      if (options.forwardSearch) {
        const qs = req.nextUrl.search;
        if (qs) upstreamPath += qs;
      }

      const upstreamUrl = `${API_BASE_URL}${upstreamPath}`;
      const method = options.upstreamMethod ?? incomingMethod;

      // Use the effective API key from platform auth, or the org key
      const apiKey =
        "effectiveApiKey" in ctx
          ? (ctx as PlatformAuthContext).effectiveApiKey
          : ctx.apiKey;

      const headers: Record<string, string> = {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      };

      let body: string | ArrayBuffer | null = null;

      if (options.forwardRawBody) {
        body = await req.arrayBuffer();
        headers["Content-Type"] =
          req.headers.get("content-type") || "application/octet-stream";
      } else if (options.forwardBody) {
        body = await req.text().catch(() => "");
        headers["Content-Type"] =
          req.headers.get("content-type") ?? "application/json";
      } else if (options.buildBody) {
        body = await options.buildBody(req);
        if (body !== null) {
          headers["Content-Type"] = "application/json";
        }
      }

      try {
        const upstream = await fetch(upstreamUrl, {
          method,
          headers,
          ...(body !== null ? { body } : {}),
          cache: "no-store",
        });

        const text = await upstream.text().catch(() => "");

        if (!upstream.ok) {
          return NextResponse.json(
            {
              error: `Upstream request failed: ${upstream.status} ${upstream.statusText}`,
              details: text,
            },
            { status: upstream.status }
          );
        }

        return new NextResponse(text, {
          status: 200,
          headers: {
            "Content-Type":
              upstream.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (error) {
        console.error(`Error proxying ${method} ${upstreamPath}:`, error);
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
      }
    };

    // Branch on auth mode
    if (options.authMode === "platform") {
      const handler = withPlatformAuth(
        "sparqfi",
        async (ctx: PlatformAuthContext) => proxyHandler(ctx)
      );
      return handler(req);
    }

    // Default: org-level auth (existing behavior)
    const handler = withOrgAuth(
      async (ctx: OrgAuthContext) => proxyHandler(ctx)
    );
    return handler(req);
  };
}
