module.exports = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH || false,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};