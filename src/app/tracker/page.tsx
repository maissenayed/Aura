'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { 
  X, 
  Check, 
  Dumbbell, 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Save, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Apple,
  Scale,
  Zap,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ExerciseItem {
  id: string;
  name: string;
  target: string;
  type: 'bodyweight' | 'weighted' | 'dumbbell';
}

interface DayPlan {
  title: string;
  exercises: ExerciseItem[];
}

interface PhaseDefinition {
  phase: number;
  months: string;
  weeks: number[]; // e.g. [1, 2, ..., 12]
  goal: string;
  vestLoad: string;
  workoutPlan: Record<string, DayPlan>;
}

// ----------------------------------------------------
// THE 12-MONTH MASTER SCHEDULE DATA MODEL (ALL 4 PHASES)
// ----------------------------------------------------

const MASTER_PHASES: PhaseDefinition[] = [
  {
    phase: 1,
    months: "Months 1-3",
    weeks: Array.from({ length: 12 }, (_, i) => i + 1), // Weeks 1 to 12
    goal: "Tendon Prep & Form",
    vestLoad: "0kg ➔ 6kg",
    workoutPlan: {
      Monday: {
        title: "Upper A (Vertical Focus)",
        exercises: [
          { id: "p1_e1", name: "Neutral Chin-ups", target: "3 x AMRAP", type: "bodyweight" },
          { id: "p1_e2", name: "Dip Bar Dips", target: "3 x 5-8", type: "weighted" },
          { id: "p1_e3", name: "Decline Push-ups", target: "3 x 8-12", type: "weighted" },
          { id: "p1_e4", name: "DB Overhead Press (8kg)", target: "3 x 12", type: "dumbbell" },
        ],
      },
      Tuesday: {
        title: "Lower & Core",
        exercises: [
          { id: "p1_e5", name: "DB Bulgarian Squats (8kg)", target: "4 x 8/leg", type: "dumbbell" },
          { id: "p1_e6", name: "Nordic Negatives", target: "3 x 5", type: "bodyweight" },
          { id: "p1_e7", name: "DB Step-ups (8kg)", target: "3 x 8/leg", type: "dumbbell" },
          { id: "p1_e8", name: "Hanging Leg Raises", target: "3 x 10", type: "bodyweight" },
          { id: "p1_e9", name: "Plank", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Wednesday: { title: "REST", exercises: [] },
      Thursday: {
        title: "Upper B (Horizontal Focus)",
        exercises: [
          { id: "p1_e10", name: "Ring Push-ups", target: "3 x 8-12", type: "weighted" },
          { id: "p1_e11", name: "Ring Rows", target: "3 x 8-12", type: "weighted" },
          { id: "p1_e12", name: "Push-up Bar Push-ups", target: "2 x AMRAP", type: "bodyweight" },
          { id: "p1_e13", name: "DB Bicep Curls (8kg)", target: "3 x 12", type: "dumbbell" },
        ],
      },
      Friday: {
        title: "Lower & Core (Repeat)",
        exercises: [
          { id: "p1_e5", name: "DB Bulgarian Squats (8kg)", target: "4 x 8/leg", type: "dumbbell" },
          { id: "p1_e6", name: "Nordic Negatives", target: "3 x 5", type: "bodyweight" },
          { id: "p1_e7", name: "DB Step-ups (8kg)", target: "3 x 8/leg", type: "dumbbell" },
          { id: "p1_e8", name: "Hanging Leg Raises", target: "3 x 10", type: "bodyweight" },
          { id: "p1_e9", name: "Plank", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Saturday: { title: "REST / MOBILITY", exercises: [] },
      Sunday: { title: "REST", exercises: [] },
    }
  },
  {
    phase: 2,
    months: "Months 4-7",
    weeks: Array.from({ length: 16 }, (_, i) => i + 13), // Weeks 13 to 28
    goal: "Mass Building",
    vestLoad: "7kg ➔ 14kg",
    workoutPlan: {
      Monday: {
        title: "Upper A (Vertical Focus)",
        exercises: [
          { id: "p2_e1", name: "W. Pull-ups", target: "4 x 5-8", type: "weighted" },
          { id: "p2_e2", name: "W. Dip Bar Dips", target: "4 x 5-8", type: "weighted" },
          { id: "p2_e3", name: "W. Ring Chin-ups", target: "3 x 8-10", type: "weighted" },
          { id: "p2_e4", name: "W. Ring Tricep Ext", target: "3 x 10", type: "weighted" },
        ],
      },
      Tuesday: {
        title: "Lower & Core",
        exercises: [
          { id: "p2_e5", name: "W. Bulgarian Squats", target: "4 x 8/leg", type: "weighted" },
          { id: "p2_e6", name: "Assisted Pistol Squats", target: "3 x 6/leg", type: "bodyweight" },
          { id: "p2_e7", name: "W. Nordic Curls", target: "3 x 6", type: "weighted" },
          { id: "p2_e8", name: "Hanging Leg Raises", target: "3 x 12", type: "bodyweight" },
          { id: "p2_e9", name: "Calf Raises", target: "4 x 15", type: "weighted" },
        ],
      },
      Wednesday: { title: "REST", exercises: [] },
      Thursday: {
        title: "Upper B (Horizontal Focus)",
        exercises: [
          { id: "p2_e10", name: "W. Ring Push-ups", target: "4 x 8-10", type: "weighted" },
          { id: "p2_e11", name: "W. Ring Rows", target: "4 x 8-10", type: "weighted" },
          { id: "p2_e12", name: "W. Decline Push-ups", target: "3 x 8-12", type: "weighted" },
          { id: "p2_e13", name: "W. Pike Push-ups", target: "3 x 8", type: "weighted" },
        ],
      },
      Friday: {
        title: "Lower & Core (Repeat)",
        exercises: [
          { id: "p2_e5", name: "W. Bulgarian Squats", target: "4 x 8/leg", type: "weighted" },
          { id: "p2_e6", name: "Assisted Pistol Squats", target: "3 x 6/leg", type: "bodyweight" },
          { id: "p2_e7", name: "W. Nordic Curls", target: "3 x 6", type: "weighted" },
          { id: "p2_e8", name: "Hanging Leg Raises", target: "3 x 12", type: "bodyweight" },
          { id: "p2_e9", name: "Calf Raises", target: "4 x 15", type: "weighted" },
        ],
      },
      Saturday: { title: "REST / MOBILITY", exercises: [] },
      Sunday: { title: "REST", exercises: [] },
    }
  },
  {
    phase: 3,
    months: "Months 8-10",
    weeks: Array.from({ length: 12 }, (_, i) => i + 29), // Weeks 29 to 40
    goal: "Muscle Density",
    vestLoad: "15kg ➔ 20kg",
    workoutPlan: {
      Monday: {
        title: "Upper A (Vertical Focus)",
        exercises: [
          { id: "p3_e1", name: "W. Pull-ups (2s Pause)", target: "4 x 5-8", type: "weighted" },
          { id: "p3_e2", name: "W. Dip Bar Dips (2s Pause)", target: "4 x 5-8", type: "weighted" },
          { id: "p3_e3", name: "W. Chin-ups", target: "3 x 8-10", type: "weighted" },
          { id: "p3_e4", name: "W. Ring Tricep Ext", target: "3 x 12", type: "weighted" },
        ],
      },
      Tuesday: {
        title: "Lower & Core",
        exercises: [
          { id: "p3_e5", name: "W. Pistol Squats", target: "3 x 6/leg", type: "weighted" },
          { id: "p3_e6", name: "Full Nordic Curls", target: "3 x 5-8", type: "bodyweight" },
          { id: "p3_e7", name: "W. Bulgarian Squats", target: "3 x 8/leg", type: "weighted" },
          { id: "p3_e8", name: "Toes-to-Bar", target: "3 x 10", type: "bodyweight" },
          { id: "p3_e9", name: "L-Sit Hold", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Wednesday: { title: "REST", exercises: [] },
      Thursday: {
        title: "Upper B (Horizontal Focus)",
        exercises: [
          { id: "p3_e10", name: "W. Ring Push-ups (2s Pause)", target: "4 x 8-10", type: "weighted" },
          { id: "p3_e11", name: "W. Ring Rows (2s Pause)", target: "4 x 8-10", type: "weighted" },
          { id: "p3_e12", name: "W. Pike Push-ups", target: "3 x AMRAP", type: "weighted" },
          { id: "p3_e13", name: "W. Ring Rear Delt Flyes", target: "3 x 12", type: "weighted" },
        ],
      },
      Friday: {
        title: "Lower & Core (Repeat)",
        exercises: [
          { id: "p3_e5", name: "W. Pistol Squats", target: "3 x 6/leg", type: "weighted" },
          { id: "p3_e6", name: "Full Nordic Curls", target: "3 x 5-8", type: "bodyweight" },
          { id: "p3_e7", name: "W. Bulgarian Squats", target: "3 x 8/leg", type: "weighted" },
          { id: "p3_e8", name: "Toes-to-Bar", target: "3 x 10", type: "bodyweight" },
          { id: "p3_e9", name: "L-Sit Hold", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Saturday: { title: "REST / MOBILITY", exercises: [] },
      Sunday: { title: "REST", exercises: [] },
    }
  },
  {
    phase: 4,
    months: "Months 11-12",
    weeks: Array.from({ length: 12 }, (_, i) => i + 41), // Weeks 41 to 52
    goal: "74kg Peak Performance",
    vestLoad: "21kg ➔ 24kg",
    workoutPlan: {
      Monday: {
        title: "Upper A (Vertical Focus)",
        exercises: [
          { id: "p4_e1", name: "W. Pull-ups", target: "4 x 5-8", type: "weighted" },
          { id: "p4_e2", name: "W. Dip Bar Dips", target: "4 x 5-8", type: "weighted" },
          { id: "p4_e3", name: "W. Ring Pull-ups", target: "3 x 8", type: "weighted" },
          { id: "p4_e4", name: "W. Ring Tricep Ext", target: "3 x AMRAP", type: "weighted" },
        ],
      },
      Tuesday: {
        title: "Lower & Core",
        exercises: [
          { id: "p4_e5", name: "W. Pistol Squats", target: "4 x 6/leg", type: "weighted" },
          { id: "p4_e6", name: "Full Nordic Curls", target: "4 x 5-8", type: "bodyweight" },
          { id: "p4_e7", name: "W. Bulgarian Squats", target: "3 x 8/leg", type: "weighted" },
          { id: "p4_e8", name: "Toes-to-Bar", target: "3 x 12", type: "bodyweight" },
          { id: "p4_e9", name: "L-Sit Hold", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Wednesday: { title: "REST", exercises: [] },
      Thursday: {
        title: "Upper B (Horizontal Focus)",
        exercises: [
          { id: "p4_e10", name: "W. Ring Push-ups", target: "4 x 8", type: "weighted" },
          { id: "p4_e11", name: "W. Ring Rows", target: "4 x 8", type: "weighted" },
          { id: "p4_e12", name: "W. Decline Push-ups", target: "3 x 8", type: "weighted" },
          { id: "p4_e13", name: "W. Pike Push-ups", target: "3 x AMRAP", type: "weighted" },
        ],
      },
      Friday: {
        title: "Lower & Core (Repeat)",
        exercises: [
          { id: "p4_e5", name: "W. Pistol Squats", target: "4 x 6/leg", type: "weighted" },
          { id: "p4_e6", name: "Full Nordic Curls", target: "4 x 5-8", type: "bodyweight" },
          { id: "p4_e7", name: "W. Bulgarian Squats", target: "3 x 8/leg", type: "weighted" },
          { id: "p4_e8", name: "Toes-to-Bar", target: "3 x 12", type: "bodyweight" },
          { id: "p4_e9", name: "L-Sit Hold", target: "3 x Max", type: "bodyweight" },
        ],
      },
      Saturday: { title: "REST / MOBILITY", exercises: [] },
      Sunday: { title: "REST", exercises: [] },
    }
  }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface LoggedData {
  weight: string;
  set1: string;
  set2: string;
  set3: string;
  set4: string;
}

interface NutritionData {
  shake: boolean;
  creatine: boolean;
}

export default function HypertrophyTracker() {
  const STORAGE_KEY = 'master_14kg_hypertrophy_tracker_v2';

  // Active Phase Filter (0 = All Phases, 1, 2, 3, 4)
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number>(1);

  // Expandable Coaching Section
  const [showCoachingGuide, setShowCoachingGuide] = useState<boolean>(true);

  // Active Selected Day Drawer State
  const [activeSelection, setActiveSelection] = useState<{ week: number; day: string; phase: PhaseDefinition } | null>(null);

  // Tracker Logged Data State: Key = `weekX_dayName_exerciseId`
  const [logs, setLogs] = useState<Record<string, LoggedData>>({});

  // Nutrition Data State: Key = `weekX_dayName_nutrition`
  const [nutrition, setNutrition] = useState<Record<string, NutritionData>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY + '_logs');
      const savedNutrition = localStorage.getItem(STORAGE_KEY + '_nutrition');
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedNutrition) setNutrition(JSON.parse(savedNutrition));
    } catch (err) {
      console.error("Failed to load tracker logs", err);
    }
  }, []);

  // Sync to localStorage
  const saveToStorage = (updatedLogs: Record<string, LoggedData>, updatedNutrition: Record<string, NutritionData>) => {
    try {
      localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(updatedLogs));
      localStorage.setItem(STORAGE_KEY + '_nutrition', JSON.stringify(updatedNutrition));
    } catch (err) {
      console.error("Failed to save tracker logs", err);
    }
  };

  // Helper to find phase by week number
  const getPhaseForWeek = (week: number): PhaseDefinition => {
    return MASTER_PHASES.find(p => p.weeks.includes(week)) || MASTER_PHASES[0];
  };

  // Log Change Handler
  const handleLogChange = (week: number, day: string, exerciseId: string, field: keyof LoggedData, value: string) => {
    const key = `week${week}_${day}_${exerciseId}`;
    const updated = {
      ...logs,
      [key]: {
        weight: logs[key]?.weight || '',
        set1: logs[key]?.set1 || '',
        set2: logs[key]?.set2 || '',
        set3: logs[key]?.set3 || '',
        set4: logs[key]?.set4 || '',
        [field]: value,
      },
    };
    setLogs(updated);
    saveToStorage(updated, nutrition);
  };

  // Nutrition Toggle Handler
  const handleNutritionToggle = (week: number, day: string, field: keyof NutritionData) => {
    const key = `week${week}_${day}_nutrition`;
    const current = nutrition[key] || { shake: false, creatine: false };
    const updated = {
      ...nutrition,
      [key]: {
        ...current,
        [field]: !current[field],
      },
    };
    setNutrition(updated);
    saveToStorage(logs, updated);
  };

  // Check if a day has logged data
  const isDayCompleted = (week: number, day: string): boolean => {
    const phase = getPhaseForWeek(week);
    const dayPlan = phase.workoutPlan[day];
    if (!dayPlan || dayPlan.exercises.length === 0) return false;
    return dayPlan.exercises.some(ex => {
      const key = `week${week}_${day}_${ex.id}`;
      const log = logs[key];
      return log && (log.set1 || log.set2 || log.set3 || log.set4 || log.weight);
    });
  };

  // Get count of logged exercises for a day
  const getDayCompletedCount = (week: number, day: string): number => {
    const phase = getPhaseForWeek(week);
    const dayPlan = phase.workoutPlan[day];
    if (!dayPlan || dayPlan.exercises.length === 0) return 0;
    return dayPlan.exercises.filter(ex => {
      const key = `week${week}_${day}_${ex.id}`;
      const log = logs[key];
      return log && (log.set1 || log.set2 || log.set3 || log.set4);
    }).length;
  };

  // Active visible phases based on filter
  const visiblePhases = selectedPhaseFilter === 0 
    ? MASTER_PHASES 
    : MASTER_PHASES.filter(p => p.phase === selectedPhaseFilter);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
        
        {/* Protocol Banner & Athlete Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Dumbbell className="w-3.5 h-3.5" />
                12-Month Master Schedule
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
                THE 14KG HYPERTROPHY <span className="text-blue-500">PROTOCOL</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                12-Month Weighted Calisthenics Master Plan • 61 kg ➔ 74 kg Lean Mass Goal
              </p>
            </div>

            {/* Athlete Profile Badge Card */}
            <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4">
              <div className="text-center px-3 border-r border-neutral-800">
                <div className="text-[10px] text-neutral-500 font-bold uppercase">Starting Profile</div>
                <div className="text-xl font-black font-mono text-neutral-300">61 KG</div>
              </div>
              <div className="text-center px-3 border-r border-neutral-800">
                <div className="text-[10px] text-blue-400 font-bold uppercase">Target Weight</div>
                <div className="text-xl font-black font-mono text-blue-400">74 KG</div>
              </div>
              <div className="text-center px-3">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Max Vest</div>
                <div className="text-xl font-black font-mono text-emerald-400">24 KG</div>
              </div>
            </div>
          </div>

          {/* Toggle Coaching Guide Accordion */}
          <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
            <button
              onClick={() => setShowCoachingGuide(!showCoachingGuide)}
              className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showCoachingGuide ? "Hide Coaching Philosophy & Strategy" : "View Coaching Philosophy & Strategy"}</span>
              {showCoachingGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] text-neutral-500 font-mono">
              Equipment: 24kg Vest, Gymnastic Rings, Dip Bars, Doorway Bar, 8kg DBs
            </span>
          </div>
        </div>

        {/* SECTION 1 & 2: COACHING PHILOSOPHY & NUTRITION CARDS */}
        {showCoachingGuide && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            
            {/* Coaching Rules */}
            <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-black uppercase text-blue-400 tracking-wider">
                <Zap className="w-4 h-4" />
                <span>Section 1: Coaching Philosophy</span>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">1. Mechanical Tension</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Moving 61kg bodyweight is no longer enough. You must use the 24kg vest to force muscle fibers to adapt by growing thicker and denser.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">2. Progressive Overload</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Relentlessly add 1-2 kg to your vest over the 365 days until you max out at 24kg.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">3. The 5-8 Rep Hypertrophy Zone</div>
                  <p className="text-neutral-400 leading-relaxed">
                    If &lt;5 reps, vest is too heavy. If &gt;9 reps effortlessly, add weight immediately.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">4. Recovery & Rest Days</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Wednesday, Saturday, and Sunday are mandatory rest days to protect joints and tendons.
                  </p>
                </div>
              </div>
            </div>

            {/* Nutrition & Supplement Strategy */}
            <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-black uppercase text-emerald-400 tracking-wider">
                <Apple className="w-4 h-4" />
                <span>Section 2: Nutrition & Supplement Strategy</span>
              </div>

              <div className="space-y-3 text-xs text-neutral-300">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">1. Caloric Surplus (+250 Cal)</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Eat 2,750 to 2,850 calories total per day. You cannot build a 74 kg body on a 61 kg diet.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">2. Serious Mass Shake Protocol</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Drink exactly 1/4 to 1/3 scoop daily post-workout. Do not take a full scoop (1,250 Cal causes fat gain).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">3. Creatine Monohydrate (5g Daily)</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Take 5g every single day without fail. Pulls intracellular water for raw strength and muscle fullness.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1">
                  <div className="font-bold text-white">4. The Weight Stall Rule</div>
                  <p className="text-neutral-400 leading-relaxed">
                    If scale hasn't moved in 3 weeks, add another +150 Cal (large banana or handful of almonds).
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Phase Filter Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-neutral-900 border border-neutral-800 p-2 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedPhaseFilter(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPhaseFilter === 0 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All 12 Months (52 Weeks)
            </button>
            {MASTER_PHASES.map(p => (
              <button
                key={p.phase}
                onClick={() => setSelectedPhaseFilter(p.phase)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedPhaseFilter === p.phase 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Phase {p.phase} ({p.months})
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-neutral-500 px-3">
            Showing {visiblePhases.reduce((acc, p) => acc + p.weeks.length, 0)} Weeks
          </div>
        </div>

        {/* THE 12-MONTH MASTER SCHEDULE GRID (PHASES 1 to 4) */}
        <div className="space-y-12">
          {visiblePhases.map(phase => (
            <div key={phase.phase} className="space-y-6">
              
              {/* Phase Header Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-mono font-black text-lg">
                    P{phase.phase}
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white uppercase">
                      PHASE {phase.phase}: {phase.goal}
                    </h2>
                    <p className="text-xs text-neutral-400 font-medium">{phase.months} • Weeks {phase.weeks[0]} to {phase.weeks[phase.weeks.length - 1]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono font-bold text-amber-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Vest Load: {phase.vestLoad}</span>
                </div>
              </div>

              {/* Weeks List */}
              <div className="space-y-6">
                {phase.weeks.map(week => (
                  <div key={week} className="space-y-2">
                    
                    {/* Week Sub-Header */}
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black font-mono uppercase tracking-widest">
                        WEEK {week}
                      </span>
                      <div className="h-[1px] flex-1 bg-neutral-800/60" />
                    </div>

                    {/* 7 Day Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {DAYS.map(day => {
                        const dayPlan = phase.workoutPlan[day];
                        const isRest = !dayPlan || dayPlan.exercises.length === 0;
                        const completed = isDayCompleted(week, day);
                        const completedCount = getDayCompletedCount(week, day);
                        const totalCount = dayPlan ? dayPlan.exercises.length : 0;

                        if (isRest) {
                          return (
                            <div
                              key={day}
                              className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-900 opacity-50 flex flex-col justify-between min-h-[105px] cursor-not-allowed select-none"
                            >
                              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                {day}
                              </div>
                              <div className="text-xs font-semibold text-neutral-600 italic">
                                {dayPlan?.title || 'REST'}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={day}
                            onClick={() => setActiveSelection({ week, day, phase })}
                            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[105px] transition-all duration-200 group ${
                              completed
                                ? 'bg-blue-950/20 border-blue-500/60 shadow-lg shadow-blue-500/5 hover:border-blue-400 hover:bg-blue-900/30'
                                : 'bg-neutral-900 border-neutral-800 hover:border-blue-500 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-extrabold text-neutral-400 group-hover:text-blue-400 uppercase tracking-wider transition">
                                {day}
                              </span>
                              {completed ? (
                                <span className="p-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                </span>
                              ) : (
                                <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                              )}
                            </div>

                            <div className="space-y-1 my-1.5">
                              <div className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-blue-200">
                                {dayPlan.title}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-medium">
                                {totalCount} Exercises
                              </div>
                            </div>

                            {/* Logged Progress pill */}
                            {completedCount > 0 && (
                              <div className="text-[10px] font-mono font-bold text-blue-400 pt-1 border-t border-neutral-800/60">
                                {completedCount}/{totalCount} Logged
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* SLIDING DRAWER (THE TRACKER) */}
      {activeSelection && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setActiveSelection(null)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300 text-neutral-100 overflow-hidden">
            
            {/* Drawer Top Header */}
            <div className="p-6 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/80 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-blue-400 uppercase tracking-widest mb-1">
                  <span>PHASE {activeSelection.phase.phase}</span>
                  <span>•</span>
                  <span>WEEK {activeSelection.week}</span>
                  <span>•</span>
                  <span>{activeSelection.day}</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  {activeSelection.phase.workoutPlan[activeSelection.day]?.title}
                </h2>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  Target Vest Load: {activeSelection.phase.vestLoad}
                </div>
              </div>

              <button
                onClick={() => setActiveSelection(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exercise List Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Exercise Cards */}
              {activeSelection.phase.workoutPlan[activeSelection.day]?.exercises.map(ex => {
                const logKey = `week${activeSelection.week}_${activeSelection.day}_${ex.id}`;
                const currentLog = logs[logKey] || { weight: '', set1: '', set2: '', set3: '', set4: '' };
                const isBodyweight = ex.type === 'bodyweight';

                return (
                  <div key={ex.id} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 shadow-inner">
                    
                    {/* Exercise Card Title & Target */}
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                      <div>
                        <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                        <span className="text-[11px] text-neutral-400 font-mono">Target: {ex.target}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${
                        ex.type === 'weighted' 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
                          : ex.type === 'dumbbell' 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' 
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {ex.type}
                      </span>
                    </div>

                    {/* Vest / Load Input */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-neutral-400 font-medium">Vest / Load (kg):</label>
                      <input
                        type="number"
                        disabled={isBodyweight}
                        placeholder={isBodyweight ? "0" : "Vest kg"}
                        value={isBodyweight ? "0" : currentLog.weight}
                        onChange={e => handleLogChange(activeSelection.week, activeSelection.day, ex.id, 'weight', e.target.value)}
                        className={`w-24 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold text-center transition ${
                          isBodyweight
                            ? 'bg-neutral-900 border-neutral-850 text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-900 border-neutral-800 text-white focus:border-blue-500 focus:outline-none'
                        }`}
                      />
                    </div>

                    {/* Reps Input Grid (4 Sets) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        Set Reps Log:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['set1', 'set2', 'set3', 'set4'] as const).map((setKey, idx) => (
                          <div key={setKey} className="flex flex-col gap-1 text-center">
                            <span className="text-[10px] text-neutral-500 font-mono">S{idx + 1}</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={currentLog[setKey]}
                              onChange={e => handleLogChange(activeSelection.week, activeSelection.day, ex.id, setKey, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-center text-white focus:border-blue-500 focus:outline-none transition"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* Nutrition Checklist */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Daily Nutrition Checklist
                </div>

                {(() => {
                  const nutKey = `week${activeSelection.week}_${activeSelection.day}_nutrition`;
                  const currentNut = nutrition[nutKey] || { shake: false, creatine: false };

                  return (
                    <div className="space-y-2.5 text-xs text-neutral-300">
                      <label className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
                        <input
                          type="checkbox"
                          checked={currentNut.shake}
                          onChange={() => handleNutritionToggle(activeSelection.week, activeSelection.day, 'shake')}
                          className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <span className="font-medium">Drank Serious Mass Shake (+250 Cal Surplus)</span>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
                        <input
                          type="checkbox"
                          checked={currentNut.creatine}
                          onChange={() => handleNutritionToggle(activeSelection.week, activeSelection.day, 'creatine')}
                          className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <span className="font-medium">Took 5g Creatine Monohydrate</span>
                      </label>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Drawer Footer Save Button */}
            <div className="p-6 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
              <button
                onClick={() => setActiveSelection(null)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-150"
              >
                <Save className="w-4 h-4" />
                <span>Save & Close</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </main>
  );
}
