import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" }),
  // output: 'export',
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9199',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        // HTML はネット優先
        urlPattern: /^https?.*\.(?:html)$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "html-cache",
          expiration: { maxEntries: 5, maxAgeSeconds: 60 },
        },
      },
      {
        // JS / CSS / Webpack チャンクはキャッシュ優先
        urlPattern: /^https?.*\.(?:js|css)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-resources",
        },
      },
      {
        // 画像はキャッシュ優先
        urlPattern: /^https?.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30日
        },
      },
    ],
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
})(nextConfig as any);
