/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
    serverActions: {
      bodySizeLimit: '200mb',
    }
  }
};

export default nextConfig;
