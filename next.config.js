/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  // Allow cross-origin requests from local network devices
  experimental: {
    allowedDevOrigins: ['http://localhost:3000', 'http://192.168.1.7:3000'],
  },
};

module.exports = nextConfig; 