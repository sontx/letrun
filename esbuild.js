import esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { rimrafSync } from 'rimraf';

rimrafSync('dist');

const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  tsconfig: 'tsconfig.json',
  platform: 'node',
  target: 'es2022',
  plugins: [nodeExternalsPlugin()],
};

esbuild
  .build({
    ...options,
    format: 'esm',
    banner: {
      js: `if (!global.require) {
  const { createRequire } = await import('module');
  global.require = createRequire(import.meta.url);
}`,
    },
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
