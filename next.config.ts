/** @type {import('next').NextConfig} */
const nextConfig = {
  // Memaksa penggunaan Webpack agar build di Vercel tidak kehabisan RAM
  webpack: (config: any) => {
    return config;
  },
  // Mengabaikan error TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Mengabaikan error ESLint saat build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;