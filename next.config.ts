import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // TODO(review-high-security-headers): Add a nonce-based production CSP plus nosniff, frame,
  // referrer, and permissions headers without blocking Next.js, Tiptap, or the authentication Web
  // Worker. XSS executes beside unlocked keys, so this is part of the crypto boundary.
};

export default createNextIntlPlugin()(nextConfig);
