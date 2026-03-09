/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  // Clear mocks automatically between tests
  clearMocks: true,
};

module.exports = config;
