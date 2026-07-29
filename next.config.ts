import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "22mb",
    },
  },
};

export default nextConfig;
