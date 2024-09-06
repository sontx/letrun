import esbuild from 'esbuild';

import { readFile } from 'fs/promises';
import path from 'path';

const packageJsonPath = path.resolve('package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const version = packageJson.version;
const description = packageJson.description;
const author = packageJson.author;

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
    define: {
      'process.env.APP_VERSION': JSON.stringify(version),
      'process.env.APP_DESCRIPTION': JSON.stringify(description),
      'process.env.APP_AUTHOR': JSON.stringify(author),
    },
    outfile: 'dist/letrun.mjs',
  })
  .catch(() => process.exit(1));
