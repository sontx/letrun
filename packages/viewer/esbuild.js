import esbuild from 'esbuild';

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: process.argv.includes('--prod'),
    keepNames: true,
    sourcesContent: false,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    banner: {
      js: `#!/usr/bin/env node
import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    outfile: 'dist/viewer.mjs',
  })
  .catch(() => process.exit(1));
