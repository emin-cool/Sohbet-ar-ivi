/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tüm sayfalar SSG; Pagefind build sonrası `out/` üzerinde indeksler (postbuild).
  output: "export",
};

export default nextConfig;
