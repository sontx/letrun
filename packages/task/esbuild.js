import esbuild from 'esbuild';
import fs from "fs";

function buildHandler(entryPoint, outputFile) {
  esbuild
    .build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: process.argv.includes('--prod'),
      keepNames: true,
      sourcesContent: false,
      platform: 'node',
      format: "esm",
      target: "esnext",
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      outfile: outputFile,
      external: ['joi', '@letrun/core', '@letrun/common'],
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

fs.readdirSync('./src')
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && file !== 'index.ts')
  .forEach((file) => buildHandler(`src/${file}`, `dist/${file.replace('.ts', '.js')}`));
