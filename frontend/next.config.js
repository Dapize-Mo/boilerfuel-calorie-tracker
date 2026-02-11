const path = require('path');

module.exports = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  
  // Production optimizations
  swcMinify: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Font optimization
  optimizeFonts: true,
  
  env: {
    // Do not default to localhost in builds. Leave empty unless explicitly provided.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH || 'false',
  },
  
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)(?:[\\/]|$)/)?.[1];
                return `lib.${packageName?.replace('@', '')}`;
              },
              priority: 10,
            },
          },
        },
      };
    }
    
    return config;
  },
};