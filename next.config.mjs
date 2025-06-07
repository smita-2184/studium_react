/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // This is the definitive fix for the "canvas.node" error on Vercel.
    config.resolve.alias.canvas = false;
    return config;
  },
}

export default nextConfig