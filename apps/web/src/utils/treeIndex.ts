import { BOULDERING_SKILLS } from '../data/boulderingTree';
import { resolveExerciseId } from '../data/exerciseAliases';
import { EXERCISES } from '../data/exercisesData';
import type { SkillTreeRef } from './campaignV3';
import { SkillGraph, TreeSkill, ancestorsOf, buildGraph } from './skillTree';

/**
 * The built-in skill trees as the campaign reads them: for skill bosses (a
 * skill and what leads to it) and towers (a summit and everything below it).
 * Built once from the app's own datasets, never from a device's edited copy.
 */

const graphs = new Map<SkillTreeRef, SkillGraph>();

function graphOf(tree: SkillTreeRef): SkillGraph {
  let graph = graphs.get(tree);
  if (!graph) {
    graph = buildGraph((tree === 'calisthenics' ? EXERCISES : BOULDERING_SKILLS) as TreeSkill[]);
    graphs.set(tree, graph);
  }
  return graph;
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
