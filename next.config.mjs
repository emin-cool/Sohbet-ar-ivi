/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
    outputFileTracingIncludes: {
      '/**': ['./dev.db']
    }
  }
};

export default nextConfig;
