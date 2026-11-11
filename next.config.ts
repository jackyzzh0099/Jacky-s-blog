import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Production builds normally live in `.next`. When a prebuilt bundle is shipped
 * with the source (CI, or a sandbox that cannot run the compiler), it lives in
 * `prebuilt` and is picked up automatically.
 */
const distDir =
  process.env.NEXT_DIST_DIR ||
  (fs.existsSync(path.join(process.cwd(), "prebuilt", "BUILD_ID"))
    ? "prebuilt"
    : ".next");

const nextConfig: NextConfig = {
  distDir,
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Keep the production build inside a small memory budget: one worker,
    // no parallel page generation. Pages are dynamic anyway.
    cpus: 1,
    workerThreads: false,
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
