import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@sentry/nextjs$": "<rootDir>/src/test-support/sentry-nextjs.ts",
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],
};

export default config;
