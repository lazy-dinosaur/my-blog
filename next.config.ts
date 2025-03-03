import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    domains: ["user-images.githubusercontent.com"],
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
