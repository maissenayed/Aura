// The crew's numbers are worked out on the server with the web app's own engine,
// so a save sent with a made-up history earns nothing the rules would not give it.
// This bundles apps/web/src/utils/serverEngine.ts (and the data it reads) into
// dist/engine/aura-engine.mjs, next to the compiled backend that imports it.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  entryPoints: [fileURLToPath(new URL('../../web/src/utils/serverEngine.ts', import.meta.url))],
  outfile: fileURLToPath(new URL('../dist/engine/aura-engine.mjs', import.meta.url)),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'warning',
});
