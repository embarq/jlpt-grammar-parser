/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: false,
  coverageProvider: 'v8',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
    // ...
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    // ...
  ],
  verbose: undefined,
  watchPathIgnorePatterns: [],
}

export default config
