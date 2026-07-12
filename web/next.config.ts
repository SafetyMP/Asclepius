import type { NextConfig } from "next";

const fhirUrl = process.env.ASCLEPIUS_API_URL ?? "http://127.0.0.1:8787";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${fhirUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
