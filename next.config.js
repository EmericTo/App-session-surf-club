/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['localhost']
  },
  // Remove output: 'export' to fix dynamic routes
  // output: 'export',
};

module.exports = nextConfig;