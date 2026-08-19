import type { NextConfig } from 'next';

const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.e2b.app'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiTarget}/api/:path*` }];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

export default nextConfig;
