/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['**/__tests__/**/*.test.js'],
  testEnvironment: 'node',
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }],
  ],
};
