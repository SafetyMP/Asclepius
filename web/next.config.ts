import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: path.resolve(import.meta.dirname, '..'),
  },
};

export default nextConfig;
