import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Memaksa Webpack
  webpack: (config) => {
    return config;
  },
  // Mengabaikan error TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Blok eslint SUDAH DIHAPUS dari sini
};

export default withPWA(nextConfig);