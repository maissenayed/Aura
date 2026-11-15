// Vercel deploys the contents of dist/ as the function, without this package's
// package.json. Node then has nothing telling it the compiled files are ES
// modules and fails on the first `import`. A package.json inside dist/ travels
// with the build output and settles it.
import { writeFileSync } from 'node:fs';

writeFileSync(new URL('../dist/package.json', import.meta.url), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
