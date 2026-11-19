import { PROP_DEFAULTS, changesOf, withChanges } from '../../../components/game/propTuning';
import type { FigurePatch } from '../../../components/skilltree/figureOverrides';
import { DATA, formatJson, isDev, notFound, readJson, writeRepo } from '../repoFiles';

/**
 * Dev only: writes the studio's edits into the repo. Figure fixes are merged
 * into `figureOverrides.json` (null removes one); props tuning replaces
 * `propTuning.json`, keeping only what differs from the defaults.
 */

const ID = /^[a-z0-9_]{1,64}$/;
const isPt = (value: unknown) => Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1000);
const isRecord = (value: unknown, item: (v: unknown) => boolean) =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && Object.entries(value).every(([key, v]) => /^\d{1,3}$/.test(key) && item(v));
const isPts = (value: unknown) => Array.isArray(value) && value.length >= 1 && value.length <= 64 && value.every(isPt);

function validPatch(value: unknown): value is FigurePatch {
  if (typeof value !== 'object' || value === null) return false;
  const patch = value as Record<string, unknown>;
  if (typeof patch.fingerprint !== 'string' || patch.fingerprint.length > 16) return false;
  for (const key of Object.keys(patch)) {
    const v = patch[key];
    if (key === 'fingerprint') continue;
    if (key === 'strokes' || key === 'motionStrokes') {
      if (!isRecord(v, isPts)) return false;
    } else if (key === 'discs' || key === 'motionDiscs' || key === 'holds') {
      if (!isRecord(v, isPt)) return false;
    } else if (key === 'wall') {
      if (typeof v !== 'string' || v.length > 4000 || !/^[MLQCSTZ\d\s.,-]*$/.test(v)) return false;
    } else if (key === 'note') {
      if (typeof v !== 'string' || v.length > 2000) return false;
    } else return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!isDev) return notFound();
  let body: { figures?: Record<string, unknown>; props?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'The request was not JSON.' }, { status: 400 });
  }

  const figures = await readJson<Record<string, FigurePatch>>(DATA.figures, {});
  for (const [id, patch] of Object.entries(body.figures ?? {})) {
    if (!ID.test(id)) return Response.json({ error: `"${id}" is not a figure id.` }, { status: 400 });
    if (patch === null) delete figures[id];
    else if (validPatch(patch)) figures[id] = patch;
    else return Response.json({ error: `The fix for ${id} is not in the expected shape.` }, { status: 400 });
  }
  const sorted = Object.fromEntries(Object.entries(figures).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  await writeRepo(DATA.figures, formatJson(sorted));

  let props = await readJson<Record<string, unknown>>(DATA.props, {});
  if (body.props !== undefined) {
    props = changesOf(withChanges(body.props, PROP_DEFAULTS));
    await writeRepo(DATA.props, formatJson(props));
  }
  return Response.json({ figures: sorted, props });
}
