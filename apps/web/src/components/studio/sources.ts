/**
 * Where each figure comes from in the code: its file, its line, and the call
 * that builds it (`dip({ rings: true })`). Read from the three figure files
 * by the studio's dev route, and kept as a snapshot in
 * `data/figureSources.json` so the studio on the live site can show it too.
 */

export interface FigureSource {
  /** Repo-relative path. */
  file: string;
  line: number;
  /** The builder call, as written. */
  call: string;
  /** The family builder's name; null for a figure drawn by hand. */
  family: string | null;
  /** For a figure that reuses another's drawing. */
  sameAs?: string;
}

export const FIGURE_FILES = {
  calisthenics: 'apps/web/src/components/skilltree/calisthenicsFigures.ts',
  gym: 'apps/web/src/components/skilltree/gymFigures.ts',
  bouldering: 'apps/web/src/components/skilltree/boulderingFigures.ts',
} as const;

const FAMILY = /^([A-Za-z_$][\w$]*)/;

export function parseSources(texts: Record<keyof typeof FIGURE_FILES, string>): Record<string, FigureSource> {
  const out: Record<string, FigureSource> = {};

  texts.calisthenics.split('\n').forEach((text, index) => {
    const match = /^\s+(ex_\d+):\s*(?:\(\)\s*=>\s*)?(.+?),?\s*(?:\/\/.*)?$/.exec(text);
    if (!match) return;
    const call = match[2].includes('(') ? match[2] : `${match[2]}()`;
    out[match[1]] = { file: FIGURE_FILES.calisthenics, line: index + 1, call, family: FAMILY.exec(call)?.[1] ?? null };
  });

  const gymLines = texts.gym.split('\n');
  const gymStart = gymLines.findIndex((text) => text.startsWith('const FIGURES'));
  gymLines.forEach((text, index) => {
    if (index <= gymStart) return;
    const entry = /^\s+([a-z0-9_]+):\s*([A-Za-z]\w*\(.*\)),?\s*(?:\/\/.*)?$/.exec(text);
    if (entry) out[entry[1]] = { file: FIGURE_FILES.gym, line: index + 1, call: entry[2], family: FAMILY.exec(entry[2])?.[1] ?? null };
    const alias = /^FIGURES\['(\w+)'\]\s*=\s*FIGURES\['(\w+)'\]/.exec(text);
    if (alias) {
      const of = out[alias[2]];
      out[alias[1]] = { file: FIGURE_FILES.gym, line: index + 1, call: of?.call ?? '', family: of?.family ?? null, sameAs: alias[2] };
    }
  });

  const climbLines = texts.bouldering.split('\n');
  const climbStart = climbLines.findIndex((text) => text.startsWith('const FIGURES'));
  climbLines.forEach((text, index) => {
    if (index <= climbStart) return;
    const entry = /^ {2}(bld_[a-z0-9_]+):\s*(\w+)\(/.exec(text);
    if (!entry) return;
    const own = entry[2] === 'figure';
    out[entry[1]] = { file: FIGURE_FILES.bouldering, line: index + 1, call: own ? 'figure({ … })' : `${entry[2]}(…)`, family: own ? null : entry[2] };
  });

  return out;
}
