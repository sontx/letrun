import esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { rimrafSync } from 'rimraf';

rimrafSync('dist');

const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  tsconfig: 'tsconfig.json',
  platform: 'node',
  target: 'esnext',
  plugins: [nodeExternalsPlugin()],
};

esbuild
  .build({
    ...options,
    format: 'esm',
    outfile: 'dist/index.mjs',
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...options,
    format: 'cjs',
    outfile: 'dist/index.cjs',
  })
  .catch(() => process.exit(1));
