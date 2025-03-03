import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    domains: ["user-images.githubusercontent.com"],
    unoptimized: true,
  },
  trailingSlash: true, // ✅ 정적 서버 라우팅 호환성
  /* config options here */
};

export default nextConfig;
