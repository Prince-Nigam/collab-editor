import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Silence the lockfile workspace root warning
  turbopack: {
    root: __dirname,
  },
  // Allow images from any domain (if needed later)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
