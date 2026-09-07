import type { Config } from 'jest';

export default {
  displayName: 'audit-service',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@attendance/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@attendance/database$': '<rootDir>/../../libs/database/src/index.ts',
    '^@attendance/messaging$': '<rootDir>/../../libs/messaging/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: '../../coverage/apps/audit-service',
} satisfies Config;
