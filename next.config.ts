import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint configuration for deployment
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration for deployment
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },

  // Experimental features
  experimental: {
    // Add any experimental features here if needed
  },

  // Image optimization
  images: {
    domains: ['media.licdn.com', 'logo.clearbit.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
