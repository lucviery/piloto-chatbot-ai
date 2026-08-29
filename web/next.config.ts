import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // A tipagem estrita é executada separadamente antes do build.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
