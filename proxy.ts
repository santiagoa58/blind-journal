import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { REQUEST_ID_HEADER } from "@/api/observability";
import { createContentSecurityPolicy } from "@/content-security-policy";
import { routing } from "@/i18n/routing";
import { toBase64 } from "./crypto/base64";

const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";
const NONCE_HEADER = "x-nonce";
// Page requests need consistent locale routing before rendering begins.
const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Do not trust client-supplied IDs: one server-generated value makes a client-visible failure
  // traceable to its internal server log without exposing that log's details.
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  // API responses are data rather than documents; correlation is useful, but locale routing and
  // a document CSP nonce are not applicable.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  // A nonce must be unique per document, otherwise an injected script could reuse a prior value.
  const nonce = toBase64(crypto.randomUUID());
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  // Custom scripts need the same nonce as the CSP; the layout passes it to the provider that owns them.
  requestHeaders.set(NONCE_HEADER, nonce);
  // Next.js needs the policy during rendering to mark its own scripts as trusted.
  requestHeaders.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);

  // The renderer must receive these headers even when locale routing rewrites or redirects the request.
  const response = handleI18nRouting(new NextRequest(request, { headers: requestHeaders }));
  // The browser only enforces a policy received on the response.
  response.headers.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
  // Preserve request-to-log correlation for page-rendering failures too.
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  // Next.js uses these rules to decide which requests run through this proxy.
  matcher: [
    // Every API path needs a server-generated ID for client-to-server error correlation.
    "/api/:path*",
    {
      // Exclude only the static assets this application actually serves. A blanket file-extension
      // exclusion also skips valid dynamic document URLs such as `/en/missing.page`, leaving those
      // rendered responses without the document CSP.
      source:
        "/((?!api/|_next/|_vercel/|brand/|icons/|favicon\\.ico$|apple-icon\\.png$|icon\\.svg$|manifest\\.webmanifest$).*)",
      // Exclude requests that Next.js marks as router prefetches.
      missing: [
        // Prefetches do not render a document, so locale routing and CSP work are unnecessary.
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
