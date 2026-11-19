import { promises as fs } from 'fs';
import path from 'path';

/**
 * The repository, as the studio's dev routes see it. They only work on a dev
 * server: on the live site the files are read-only and these routes answer 404.
 */

export const isDev = process.env.NODE_ENV === 'development';

export const notFound = () => new Response('Not found', { status: 404 });

// The paths are only known at run time, on a dev server: the ignore comments keep the build from tracing the whole repo into these routes.
let root: string | null = null;

/** The repo root: the folder with `apps/web/src/data`, found from wherever the dev server runs. */
export async function repoRoot(): Promise<string> {
  if (root) return root;
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    try {
      await fs.access(path.join(/*turbopackIgnore: true*/ dir, 'apps/web/src/data'));
      root = dir;
      return dir;
    } catch {
      dir = path.dirname(dir);
    }
  }
  throw new Error('Could not find the repository from the dev server.');
}

export const DATA = {
  figures: 'apps/web/src/data/figureOverrides.json',
  props: 'apps/web/src/data/propTuning.json',
  sources: 'apps/web/src/data/figureSources.json',
} as const;

export async function readRepo(file: string): Promise<string> {
  return fs.readFile(path.join(/*turbopackIgnore: true*/ await repoRoot(), file), 'utf8');
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readRepo(file)) as T;
  } catch {
    return fallback;
  }
}

/** JSON with each point on one line, so a fix reads as a short list in a diff. */
export const formatJson = (data: unknown) => `${JSON.stringify(data, null, 2).replace(/\[\s*(-?[\d.e+-]+),\s*(-?[\d.e+-]+)\s*\]/g, '[$1, $2]')}\n`;

/** Writes only when the content changed, so the dev server doesn't reload for nothing. */
export async function writeRepo(file: string, text: string): Promise<boolean> {
  const at = path.join(/*turbopackIgnore: true*/ await repoRoot(), file);
  const before = await fs.readFile(at, 'utf8').catch(() => null);
  if (before === text) return false;
  await fs.writeFile(at, text, 'utf8');
  return true;
}
