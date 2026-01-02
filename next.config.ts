import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // 完全静的化でCloud Run課金を回避
  images: {
    unoptimized: true,  // 静的エクスポートでは必須
  },
  trailingSlash: true,  // Firebase Hosting互換
};

export default nextConfig;
