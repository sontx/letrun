import esbuild from 'esbuild';
import fs from 'fs';

function buildHandler(entryPoint, outputFile) {
  esbuild
    .build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: process.argv.includes('--prod'),
      keepNames: true,
      sourcesContent: false,
      platform: 'node',
      format: 'esm',
      target: 'esnext',
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      outfile: outputFile,
      external: ['joi', 'winston'],
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

fs.readdirSync('./src').forEach((file) => {
  if (file.endsWith('.ts') && file !== 'index.ts') {
    buildHandler(`src/${file}`, `dist/${file.replace('.ts', '.js')}`);
  }
});
