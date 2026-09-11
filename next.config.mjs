/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
    serverActions: {
      bodySizeLimit: '200mb',
    },
    outputFileTracingIncludes: {
      '/**': ['./dev.db']
    }
  }
};

export default nextConfig;
