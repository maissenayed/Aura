import React from 'react';
import { Dumbbell, Mountain } from 'lucide-react';
import { BOULDERING_RULES, BOULDERING_SKILLS, fontGrade, vGrade } from '../../data/boulderingSkills';
import { SkillTreeId } from '../../utils/skillProgressStore';
import { CALISTHENICS_RULES, TreeRules, TreeSkill } from '../../utils/skillTree';
import { FigureSpec } from './SkillFigure';
import { BOULDERING_LANE_THEME, FALLBACK_LANE_THEME, LANE_THEME, LaneTheme } from './laneTheme';
import { boulderingFigure } from './boulderingFigures';

/**
 * Everything that makes one skill tree look and read differently from another:
 * its branches and their colours, how a level is named, what a skill is called.
 * The canvas, toolbar and panel take one of these and stay the same code.
 */
export interface SkillTreeDef {
  id: SkillTreeId;
  label: string;
  icon: React.ReactNode;
  rules: TreeRules;
  /** The built-in skills; the calisthenics tree reads its exercises from the device instead. */
  skills?: TreeSkill[];
  lanes: Record<string, LaneTheme>;
  noun: { one: string; many: string };
  /** "level" or "grade" — how the columns are spoken of in sentences. */
  levelWord: string;
  /** Column headers and details: "Level 4", "V4 · 6B+". */
  levelName: (level: number) => string;
  /** The short tag on a card: "L4", "V4". */
  levelTag: (level: number) => string;
  /** "Levels 1–3", "V0–V2". */
  levelRange: (min: number, max: number) => string;
  /** Skills up to this level count as the basics an athlete can skip past. */
  basicsMax: number;
  searchPlaceholder: string;
  /** Added to a skill's name when searching for a tutorial. */
  tutorialTopic: string;
  /** An illustration for a skill, when the tree has them. */
  figureFor?: (id: string) => FigureSpec | undefined;
}

const ICON = 'w-4 h-4';

export const CALISTHENICS_TREE: SkillTreeDef = {
  id: 'calisthenics',
  label: 'Calisthenics',
  icon: <Dumbbell className={ICON} />,
  rules: CALISTHENICS_RULES,
  lanes: LANE_THEME,
  noun: { one: 'exercise', many: 'exercises' },
  levelWord: 'level',
  levelName: (level) => `Level ${level}`,
  levelTag: (level) => `L${level}`,
  levelRange: (min, max) => `Levels ${min}–${max}`,
  basicsMax: 3,
  searchPlaceholder: 'Find an exercise — muscle-up, planche, pistol…',
  tutorialTopic: 'calisthenics tutorial',
};

export const BOULDERING_TREE: SkillTreeDef = {
  id: 'bouldering',
  label: 'Bouldering',
  icon: <Mountain className={ICON} />,
  rules: BOULDERING_RULES,
  skills: BOULDERING_SKILLS,
  lanes: BOULDERING_LANE_THEME,
  noun: { one: 'skill', many: 'skills' },
  levelWord: 'grade',
  levelName: (level) => `${vGrade(level)} · ${fontGrade(level)}`,
  levelTag: (level) => vGrade(level),
  levelRange: (min, max) => `${vGrade(min)}–${vGrade(max)}`,
  basicsMax: 2,
  searchPlaceholder: 'Find a skill — heel hook, dyno, drop knee…',
  tutorialTopic: 'bouldering technique',
  figureFor: boulderingFigure,
};

export const SKILL_TREES: Record<SkillTreeId, SkillTreeDef> = {
  calisthenics: CALISTHENICS_TREE,
  bouldering: BOULDERING_TREE,
};

export const laneThemeOf = (tree: SkillTreeDef, lane: string): LaneTheme => tree.lanes[lane] ?? FALLBACK_LANE_THEME;
