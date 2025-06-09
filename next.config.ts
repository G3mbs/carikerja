import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Set base path for GitHub Pages (will be set by environment variable)
  basePath: process.env.NODE_ENV === 'production' ? '/carikerja' : '',

  // Ensure trailing slash for GitHub Pages
  trailingSlash: true,

  // Disable server-side features that don't work with static export
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;
