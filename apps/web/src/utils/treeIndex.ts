import { BOULDERING_SKILLS } from '../data/boulderingTree';
import { resolveExerciseId } from '../data/exerciseAliases';
import { currentExercises, fromExerciseList } from '../data/exercisesData';
import type { SkillTreeRef } from './campaignV3';
import { SkillGraph, TreeSkill, ancestorsOf, buildGraph } from './skillTree';

/**
 * The skill trees as the campaign reads them: for skill bosses (a
 * skill and what leads to it) and towers (a summit and everything below it).
 * Built from the exercise list in use (rebuilt when it changes) and the
 * bouldering dataset.
 */

const calisthenicsGraph = fromExerciseList(() => buildGraph(currentExercises() as TreeSkill[]));
let boulderingGraph: SkillGraph | null = null;

function graphOf(tree: SkillTreeRef): SkillGraph {
  if (tree === 'calisthenics') return calisthenicsGraph();
  return (boulderingGraph ??= buildGraph(BOULDERING_SKILLS as TreeSkill[]));
}

/** The id a skill lives under now (calisthenics ids merged in the rebuilds resolve). */
export const canonicalSkill = (tree: SkillTreeRef, id: string) => (tree === 'calisthenics' ? resolveExerciseId(id) : id);

export function skillOf(tree: SkillTreeRef, id: string): TreeSkill | undefined {
  return graphOf(tree).byId.get(canonicalSkill(tree, id));
}

/**
 * The skill and every skill it needs, easiest first: a skill boss's weak points,
 * or a tower's floors.
 */
export function floorsOf(tree: SkillTreeRef, summit: string): TreeSkill[] {
  const graph = graphOf(tree);
  const id = canonicalSkill(tree, summit);
  if (!graph.byId.has(id)) return [];
  const ids = ancestorsOf(graph, id);
  ids.add(id);
  return [...ids]
    .map((skill) => graph.byId.get(skill))
    .filter((skill): skill is TreeSkill => Boolean(skill))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/** The mastered skill ids of one tree, from the save's `tree:id` keys. */
export function masteredIn(skills: Record<string, string> | undefined, tree: SkillTreeRef): Set<string> {
  const prefix = `${tree}:`;
  return new Set(
    Object.keys(skills ?? {})
      .filter((key) => key.startsWith(prefix))
      .map((key) => canonicalSkill(tree, key.slice(prefix.length))),
  );
}

/** Every skill of a tree, easiest first. */
export function allSkills(tree: SkillTreeRef): TreeSkill[] {
  return [...graphOf(tree).byId.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}
