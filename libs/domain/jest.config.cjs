module.exports = {
  displayName: 'domain',
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
    '^@templateforge/db$': '<rootDir>/../db/src/index.ts',
    '^@templateforge/shared-types$': '<rootDir>/../shared-types/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
