/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // Dangerously allow production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    };
    
    // Ignore optional peer dependencies
    config.externals = config.externals || [];
    config.externals.push({
      '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage'
    });
    
    return config;
  },
}

module.exports = nextConfig
