import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["user-images.githubusercontent.com"],
  },
  /* config options here */
  // 서버 미들웨어 조정
  experimental: {
    serverComponentsExternalPackages: ["gray-matter"],
  },
};

export default nextConfig;
