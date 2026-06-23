module.exports = {
  displayName: 'backend',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'es2022',
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@templateforge/domain$': '<rootDir>/../../libs/domain/src/index.ts',
    '^@templateforge/db$': '<rootDir>/../../libs/db/src/index.ts',
    '^@templateforge/shared-types$':
      '<rootDir>/../../libs/shared-types/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
