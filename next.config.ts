import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Keep refreshes on the app's public root URL instead of redirecting
        // returning users to /index.html.
        { source: '/', destination: '/index.html' },
      ],
    };
  },
};

export default nextConfig;
