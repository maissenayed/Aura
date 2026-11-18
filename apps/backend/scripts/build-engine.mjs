// The crew's numbers are worked out on the server with the web app's own engine,
// so a save sent with a made-up history earns nothing the rules would not give it.
// This bundles apps/web/src/utils/serverEngine.ts (and the data it reads) into
// aura-engine.mjs, written twice:
// - src/engine/, beside its hand-written types: Vercel packages the function
//   from the sources, so the import has to resolve there (gitignored);
// - dist/engine/, next to the compiled backend that imports it locally.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('../../web/src/utils/serverEngine.ts', import.meta.url));
for (const out of ['../src/engine/aura-engine.mjs', '../dist/engine/aura-engine.mjs']) {
  await build({
    entryPoints: [entry],
    outfile: fileURLToPath(new URL(out, import.meta.url)),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'warning',
  });
}
