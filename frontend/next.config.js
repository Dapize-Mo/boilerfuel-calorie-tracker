const path = require('path');

module.exports = {
  reactStrictMode: true,
  env: {
    // Do not default to localhost in builds. Leave empty unless explicitly provided.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH || 'false',
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};