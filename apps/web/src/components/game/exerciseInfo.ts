import { BOULDERING_SKILLS } from '../../data/boulderingTree';
import { resolveExerciseId } from '../../data/exerciseAliases';
import { currentExercises, fromExerciseList } from '../../data/exercisesData';
import type { SkillTreeId } from '../../utils/skillProgressStore';
import { SKILL_TREES } from '../skilltree/skillTrees';
import { lookalikeOf } from './figures';

/** How-to for a campaign exercise, taken from its skill-tree skill (or the closest one). */
export interface ExerciseInfo {
  tree: SkillTreeId;
  skillId: string;
  skillName: string;
  /** False when the exercise only resembles the skill, so its steps are a close guide. */
  exact: boolean;
  levelName: string;
  steps: string[];
  tip?: string;
  standard?: string;
  summary?: string;
}

interface SkillLike {
  id: string;
  name: string;
  level: number;
  description: string[];
  expertTip?: string;
  unlockRequirements: string;
  summary?: string;
}

const BOULDERING_BY_ID = new Map<string, SkillLike>(BOULDERING_SKILLS.map((skill) => [skill.id, skill]));
const sources = fromExerciseList((): { tree: SkillTreeId; byId: Map<string, SkillLike> }[] => [
  { tree: 'calisthenics', byId: new Map(currentExercises().map((skill) => [skill.id, skill])) },
  { tree: 'bouldering', byId: BOULDERING_BY_ID },
]);

/** The dataset fills exercises without written steps with the same four generic lines. */
const GENERIC_STEPS = /^1\. Position your body in the starting/;

function infoFrom(tree: SkillTreeId, skill: SkillLike, exact: boolean): ExerciseInfo {
  const steps = skill.description.length && GENERIC_STEPS.test(skill.description[0]) ? [] : skill.description;
  return {
    tree,
    skillId: skill.id,
    skillName: skill.name,
    exact,
    levelName: SKILL_TREES[tree].levelName(skill.level),
    steps,
    tip: skill.expertTip,
    standard: skill.unlockRequirements,
    summary: skill.summary,
  };
}

export function exerciseInfo(exerciseId: string): ExerciseInfo | null {
  const id = resolveExerciseId(exerciseId);
  for (const source of sources()) {
    const skill = source.byId.get(id);
    if (skill) return infoFrom(source.tree, skill, true);
  }
  const twin = lookalikeOf(id);
  const skill = twin ? sources().find((source) => source.tree === twin.tree)?.byId.get(twin.id) : undefined;
  return twin && skill ? infoFrom(twin.tree, skill, false) : null;
}

/** A tutorial search for the exercise, on YouTube. */
export function tutorialUrl(name: string, topic = 'proper form tutorial'): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${topic}`)}`;
}
