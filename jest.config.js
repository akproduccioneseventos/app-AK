
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/firebase/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.*SemanticAttributes.*$': '<rootDir>/src/lib/empty-mock.js',
    '^.*SemanticResourceAttributes.*$': '<rootDir>/src/lib/empty-mock.js',
    '^@opentelemetry/sdk-node$': '<rootDir>/src/lib/empty-mock.js',
    '^@opentelemetry/exporter-trace-otlp-proto$': '<rootDir>/src/lib/empty-mock.js',
    '^@opentelemetry/otlp-transformer.*$': '<rootDir>/src/lib/empty-mock.js',
  },
}

module.exports = createJestConfig(customJestConfig)
