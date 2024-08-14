import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  silent: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
};

export default config;
