import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevents a response from being interpreted as executable content despite its declared type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Protects older browsers from clickjacking; CSP frame-ancestors provides the modern equivalent.
          { key: "X-Frame-Options", value: "DENY" },
          // Keeps page URLs from being disclosed to another origin through the Referer header.
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            // Removes browser capabilities the journal does not need, reducing the impact of injected code.
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin()(nextConfig);
