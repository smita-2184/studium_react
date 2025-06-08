/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Handle canvas module for react-konva
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas');
    }
    
    return config;
  },
};

module.exports = nextConfig; 