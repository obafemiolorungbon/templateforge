const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  resolve: {
    alias: {
      '@templateforge/db': join(__dirname, '../../libs/db/src/index.ts'),
      '@templateforge/domain': join(
        __dirname,
        '../../libs/domain/src/index.ts',
      ),
      '@templateforge/shared-types': join(
        __dirname,
        '../../libs/shared-types/src/index.ts',
      ),
      '@templateforge/api-client': join(
        __dirname,
        '../../libs/api-client/src/index.ts',
      ),
    },
  },
  output: {
    path: join(__dirname, 'dist'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
