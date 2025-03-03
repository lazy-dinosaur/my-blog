import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["user-images.githubusercontent.com"],
  },
  /* config options here */
  // 프로덕션 빌드에 정적 파일 포함
  output: "standalone",
  // 서버 미들웨어 조정
  experimental: {
    serverComponentsExternalPackages: ["gray-matter"],
  },
};

export default nextConfig;
