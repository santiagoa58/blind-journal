import "server-only";

import { getServerEnvironment } from "@/server/environment";

export function createContentSecurityPolicy(nonce: string, secureRequest: boolean) {
  const isDevelopment = getServerEnvironment().nodeEnvironment === "development";
  const directives = [
    // Allows unspecified resources only from this website.
    "default-src 'self'",
    // Allows same-origin and nonce-approved scripts; enables unsafe evaluation in development.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // Blocks JavaScript inside HTML attributes, such as onclick.
    "script-src-attr 'none'",
    // Radix Themes and the notification layer use runtime style elements and attributes.
    // Script execution remains nonce-restricted independently.
    "style-src 'self' 'unsafe-inline'",
    // Allows network connections only to this website.
    "connect-src 'self'",
    // Allows fonts only from this website.
    "font-src 'self'",
    // Allows images from this website, Blob URLs, and data URLs.
    "img-src 'self' blob: data:",
    // Allows the web app manifest only from this website.
    "manifest-src 'self'",
    // Blocks audio and video files from loading.
    "media-src 'none'",
    // Blocks plugins and embedded objects from loading.
    "object-src 'none'",
    // Allows web workers only from this website.
    "worker-src 'self'",
    // Blocks the page from changing its base URL.
    "base-uri 'none'",
    // Allows forms to submit only to this website.
    "form-action 'self'",
    // Blocks this page from embedding frames or iframes.
    "frame-src 'none'",
    // Blocks other websites from embedding this page in a frame.
    "frame-ancestors 'none'",
    // Upgrades HTTP resource URLs only when the document itself was securely delivered.
    ...(!isDevelopment && secureRequest ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}
