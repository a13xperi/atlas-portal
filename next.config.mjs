/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api-production-9bef.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
