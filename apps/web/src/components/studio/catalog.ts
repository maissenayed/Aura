import { BOULDERING_SKILLS } from '../../data/boulderingTree';
import { EXERCISE_CATALOG } from '../../data/campaignCatalog';
import { EXERCISES } from '../../data/exercisesData';
import snapshot from '../../data/figureSources.json';
import { BOULDERING_FIGURE_IDS, boulderingFigureAsBuilt } from '../skilltree/boulderingFigures';
import { CALISTHENICS_FIGURE_IDS, calisthenicsFigureAsBuilt } from '../skilltree/calisthenicsFigures';
import { GYM_FIGURE_IDS, gymFigureAsBuilt } from '../skilltree/gymFigures';
import type { FigureSpec } from '../skilltree/SkillFigure';
import type { FigureSource } from './sources';

/** Every figure the app can draw, with its name and how to build it fresh. */

export type Tree = 'calisthenics' | 'gym' | 'bouldering';

export const TREE_LABEL: Record<Tree, string> = { calisthenics: 'Calisthenics', gym: 'Gym', bouldering: 'Bouldering' };

export interface Entry {
  id: string;
  tree: Tree;
  name: string;
  level?: number;
  /** The figure as its builder draws it, before any studio fix. */
  asBuilt: () => FigureSpec;
}

const names = new Map<string, { name: string; level?: number }>();
EXERCISE_CATALOG.forEach((exercise) => names.set(exercise.id, { name: exercise.name }));
EXERCISES.forEach((exercise) => names.set(exercise.id, { name: exercise.name, level: exercise.level }));
BOULDERING_SKILLS.forEach((skill) => names.set(skill.id, { name: skill.name, level: skill.level }));

const built = new Map<string, FigureSpec>();
const builder = (id: string, make: (id: string) => FigureSpec | undefined) => () => {
  let spec = built.get(id);
  if (!spec) {
    spec = make(id)!;
    built.set(id, spec);
  }
  return spec;
};

const entries = (tree: Tree, ids: string[], make: (id: string) => FigureSpec | undefined): Entry[] =>
  ids.map((id) => ({ id, tree, name: names.get(id)?.name ?? id, level: names.get(id)?.level, asBuilt: builder(id, make) }));

export const CATALOG: Entry[] = [
  ...entries('calisthenics', CALISTHENICS_FIGURE_IDS, calisthenicsFigureAsBuilt),
  ...entries('gym', GYM_FIGURE_IDS, gymFigureAsBuilt),
  ...entries('bouldering', BOULDERING_FIGURE_IDS, boulderingFigureAsBuilt),
].sort((a, b) => (a.tree === b.tree ? (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name) : 0));

export const ENTRY_BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]));

/** The committed snapshot of where figures come from; the dev route serves a fresh one. */
export const SOURCE_SNAPSHOT = snapshot as Record<string, FigureSource>;

/** Figures built by the same family function in the same file. */
export function siblingsOf(id: string, sources: Record<string, FigureSource>): string[] {
  const own = sources[id];
  if (!own?.family) return [];
  return CATALOG.filter((entry) => entry.id !== id && sources[entry.id]?.family === own.family && sources[entry.id]?.file === own.file).map((entry) => entry.id);
}
