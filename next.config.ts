import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers.ts";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.kopikenangan.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'gambar.cimagroup.my.id',
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Panel admin tidak boleh di-cache di edge maupun browser.
        // Tanpa ini Next.js memberi s-maxage=31536000 pada halaman statis,
        // sehingga HTML admin bisa tersimpan di CDN Cloudflare.
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        // Terapkan security header ke semua route, termasuk API dan asset.
        source: "/:path*",
        headers: buildSecurityHeaders({ isProduction }),
      },
    ];
  },
};

export default nextConfig;
