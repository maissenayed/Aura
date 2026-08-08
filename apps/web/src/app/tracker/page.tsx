'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { WeekPlanBlock, MonthlyCalendarSchedule, EquipmentItem, Swimlane } from '@aura/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Flame, 
  Dumbbell, 
  Trophy, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Save, 
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Award,
  Layers,
  Plus,
  GripVertical,
  Trash2,
  Info
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

// --- ORIGINAL 14KG HYPERTROPHY PROTOCOL DATA STRUCTURES ---
interface Exercise {
  id: string;
  name: string;
  target: string;
  type: 'weighted' | 'bodyweight' | 'dumbbell';
}

interface WorkoutDay {
  title: string;
  focus: string;
  exercises: Exercise[];
}

interface Phase {
  phase: number;
  title: string;
  subtitle: string;
  vestLoad: string;
  weeks: number[];
  workoutPlan: {
    [key: string]: WorkoutDay;
  };
}

const PHASES: Phase[] = [
  {
    phase: 1,
    title: "Phase 1: Base Hypertrophy & Density",
    subtitle: "Weeks 1 - 4 • Foundation & Muscle Accumulation",
    vestLoad: "14 kg Constant Vest Load",
    weeks: [1, 2, 3, 4],
    workoutPlan: {
      "Day 1": {
        title: "Upper Body Heavy (Push & Pull)",
        focus: "Chest, Lats & Shoulders Overload",
        exercises: [
          { id: "p1_d1_1", name: "Weighted Dips (+14kg)", target: "4 Sets x 6-8 Reps (2 min rest)", type: "weighted" },
          { id: "p1_d1_2", name: "Weighted Pull-Ups (+14kg)", target: "4 Sets x 5-8 Reps (2 min rest)", type: "weighted" },
          { id: "p1_d1_3", name: "Ring Push-Ups (Feet Elevated +14kg)", target: "3 Sets x 10-12 Reps", type: "weighted" },
          { id: "p1_d1_4", name: "Bodyweight Inverted Rows (Pause at top)", target: "3 Sets x 12 Reps", type: "bodyweight" },
          { id: "p1_d1_5", name: "Dumbbell Bicep Curls / Hammer Curls", target: "3 Sets x 10-12 Reps", type: "dumbbell" },
        ]
      },
      "Day 2": {
        title: "Lower Body & Core Compression",
        focus: "Quads, Posterior Chain & Hollow Body",
        exercises: [
          { id: "p1_d2_1", name: "Weighted Pistol Squats (+14kg or Assisted)", target: "4 Sets x 6-8 Reps / leg", type: "weighted" },
          { id: "p1_d2_2", name: "Nordic Hamstring Curls (Negative)", target: "3 Sets x 5-6 Reps (Slow eccentric)", type: "bodyweight" },
          { id: "p1_d2_3", name: "Weighted Bulgarian Split Squats (+14kg)", target: "3 Sets x 10 Reps / leg", type: "weighted" },
          { id: "p1_d2_4", name: "Hollow Body Hold (+14kg Vest)", target: "4 Sets x 30-45 Sec Hold", type: "weighted" },
          { id: "p1_d2_5", name: "Hanging Leg Raises / Dragon Flag Negatives", target: "3 Sets x 8-10 Reps", type: "bodyweight" },
        ]
      },
      "Day 3": {
        title: "Upper Body Hypertrophy (Rings & Iso Holds)",
        focus: "Time Under Tension & Stabilizer Hypertrophy",
        exercises: [
          { id: "p1_d3_1", name: "Ring Dips (Bodyweight or +14kg)", target: "4 Sets x 8-10 Reps", type: "weighted" },
          { id: "p1_d3_2", name: "Neutral Grip Pull-Ups / Chin-Ups (+14kg)", target: "4 Sets x 6-8 Reps", type: "weighted" },
          { id: "p1_d3_3", name: "Pike Push-Ups / Handstand Push-Up Progression", target: "3 Sets x 8-10 Reps", type: "bodyweight" },
          { id: "p1_d3_4", name: "Ring Face Pulls & Rear Delt Flyes", target: "3 Sets x 12-15 Reps", type: "bodyweight" },
          { id: "p1_d3_5", name: "Dumbbell Overhead Tricep Extensions", target: "3 Sets x 10-12 Reps", type: "dumbbell" },
        ]
      },
      "Day 4": {
        title: "Deload & Scapular / Wrist Mobility",
        focus: "Joint Health, Tendon Recovery & Scapular Control",
        exercises: [
          { id: "p1_d4_1", name: "Scapular Pull-Ups & Dip Shrugs", target: "3 Sets x 12 Reps", type: "bodyweight" },
          { id: "p1_d4_2", name: "Wrist Flexor & Extensor Mobility Drills", target: "10 Minutes Flow", type: "bodyweight" },
          { id: "p1_d4_3", name: "Thoracic Spine Foam Rolling & Doorway Stretch", target: "10 Minutes Flow", type: "bodyweight" },
        ]
      }
    }
  },
  {
    phase: 2,
    title: "Phase 2: Peak Strength & Mechanical Tension",
    subtitle: "Weeks 5 - 8 • Heavy Overload & Skill Integration",
    vestLoad: "14 kg Vest + Added Load",
    weeks: [5, 6, 7, 8],
    workoutPlan: {
      "Day 1": {
        title: "Heavy Upper Body Strength",
        focus: "Max Mechanical Load (Dips & Pull-ups)",
        exercises: [
          { id: "p2_d1_1", name: "Heavy Weighted Dips (+14kg + extra)", target: "5 Sets x 5 Reps (2.5 min rest)", type: "weighted" },
          { id: "p2_d1_2", name: "Heavy Weighted Pull-Ups (+14kg + extra)", target: "5 Sets x 4-5 Reps (2.5 min rest)", type: "weighted" },
          { id: "p2_d1_3", name: "Deficit Ring Push-Ups (+14kg)", target: "3 Sets x 8-10 Reps", type: "weighted" },
          { id: "p2_d1_4", name: "Weighted L-Sit Pull-Ups (+14kg)", target: "3 Sets x 5 Reps", type: "weighted" },
          { id: "p2_d1_5", name: "Heavy Dumbbell Hammer Curls", target: "3 Sets x 8 Reps", type: "dumbbell" },
        ]
      },
      "Day 2": {
        title: "Leg Power & Core Stability",
        focus: "Single Leg Overload & Core Compression",
        exercises: [
          { id: "p2_d2_1", name: "Elevated Pistol Squats (+14kg)", target: "4 Sets x 8 Reps / leg", type: "weighted" },
          { id: "p2_d2_2", name: "Weighted Step-Ups (+14kg + Dumbbells)", target: "3 Sets x 10 Reps / leg", type: "weighted" },
          { id: "p2_d2_3", name: "Nordic Hamstring Curls (Full Eccentric + Concentric)", target: "4 Sets x 5 Reps", type: "bodyweight" },
          { id: "p2_d2_4", name: "Weighted Dragon Flag Negatives (+14kg)", target: "4 Sets x 5 Reps", type: "weighted" },
          { id: "p2_d2_5", name: "Ab Wheel Rollouts (Standing / Kneeling)", target: "3 Sets x 10 Reps", type: "bodyweight" },
        ]
      },
      "Day 3": {
        title: "Skill Holds & Hypertrophy Density",
        focus: "Planche & Front Lever Static Overload",
        exercises: [
          { id: "p2_d3_1", name: "Weighted Ring Dips (+14kg)", target: "4 Sets x 6-8 Reps", type: "weighted" },
          { id: "p2_d3_2", name: "Front Lever Tuck Raises / Holds", target: "4 Sets x 6-10 Sec Hold", type: "bodyweight" },
          { id: "p2_d3_3", name: "Planche Lean Push-Ups (+14kg)", target: "4 Sets x 8 Reps", type: "weighted" },
          { id: "p2_d3_4", name: "Weighted Archer Pull-Ups", target: "3 Sets x 6 Reps / side", type: "bodyweight" },
          { id: "p2_d3_5", name: "Dumbbell Skull Crushers", target: "3 Sets x 10 Reps", type: "dumbbell" },
        ]
      },
      "Day 4": {
        title: "Active Recovery & Soft Tissue Flow",
        focus: "Connective Tissue & Tendon Health",
        exercises: [
          { id: "p2_d4_1", name: "German Hang / Skin the Cat Stretch", target: "3 Sets x 30 Sec Hold", type: "bodyweight" },
          { id: "p2_d4_2", name: "Wrist & Elbow Rotational Flows", target: "10 Minutes Flow", type: "bodyweight" },
          { id: "p2_d4_3", name: "Hamstring & Hip Flexor Dynamic Stretching", target: "10 Minutes Flow", type: "bodyweight" },
        ]
      }
    }
  },
  {
    phase: 3,
    title: "Phase 3: Max Density & Peak Hypertrophy",
    subtitle: "Weeks 9 - 12 • Volume Peak & Muscle Definition",
    vestLoad: "14 kg Vest + High Rep Density",
    weeks: [9, 10, 11, 12],
    workoutPlan: {
      "Day 1": {
        title: "Upper Body Max Volume & Burnout",
        focus: "Maximum Sarcoplasmic Hypertrophy",
        exercises: [
          { id: "p3_d1_1", name: "Weighted Dips Drop-Sets (+14kg to BW)", target: "4 Sets x 8 + Burnout BW", type: "weighted" },
          { id: "p3_d1_2", name: "Weighted Pull-Ups Drop-Sets (+14kg to BW)", target: "4 Sets x 6 + Burnout BW", type: "weighted" },
          { id: "p3_d1_3", name: "Ring Flyes / Deficit Ring Push-Ups", target: "3 Sets x 12 Reps", type: "bodyweight" },
          { id: "p3_d1_4", name: "Ring Muscle-Up Progressions / High Pull-Ups", target: "4 Sets x 4-6 Reps", type: "bodyweight" },
          { id: "p3_d1_5", name: "Incline Dumbbell Bicep Curls", target: "3 Sets x 12 Reps", type: "dumbbell" },
        ]
      },
      "Day 2": {
        title: "Lower Body Density & Explosive Power",
        focus: "Explosive Leg Power & Core Endurance",
        exercises: [
          { id: "p3_d2_1", name: "Explosive Pistol Squats (+14kg)", target: "4 Sets x 6 Reps / leg", type: "weighted" },
          { id: "p3_d2_2", name: "Weighted Jumping Lunges (+14kg)", target: "3 Sets x 12 Reps total", type: "weighted" },
          { id: "p3_d2_3", name: "Nordic Hamstring Curls (Weighted / Unassisted)", target: "4 Sets x 6 Reps", type: "bodyweight" },
          { id: "p3_d2_4", name: "Toes-to-Bar / Hanging Leg Raises (+14kg)", target: "4 Sets x 10 Reps", type: "weighted" },
          { id: "p3_d2_5", name: "Weighted Plank Hold (+14kg)", target: "3 Sets x 60 Sec Hold", type: "weighted" },
        ]
      },
      "Day 3": {
        title: "Upper Body Skill Conditioning",
        focus: "Full Calisthenics Mastery Integration",
        exercises: [
          { id: "p3_d3_1", name: "Weighted Ring Dip Iso-Holds (+14kg)", target: "4 Sets x 6 Reps (3 sec hold at top/bottom)", type: "weighted" },
          { id: "p3_d3_2", name: "Weighted L-Sit Chin-Ups (+14kg)", target: "4 Sets x 6 Reps", type: "weighted" },
          { id: "p3_d3_3", name: "Handstand Push-Ups (Wall / Freestanding)", target: "4 Sets x 5-8 Reps", type: "bodyweight" },
          { id: "p3_d3_4", name: "Korean Dips / Straight Bar Dips (+14kg)", target: "3 Sets x 8 Reps", type: "weighted" },
          { id: "p3_d3_5", name: "Tricep Ring Extensions", target: "3 Sets x 12 Reps", type: "bodyweight" },
        ]
      },
      "Day 4": {
        title: "Deload & Complete Regeneration",
        focus: "CNS Reset & Preparation for Max Test",
        exercises: [
          { id: "p4_d4_1", name: "Light Hanging & Decompression", target: "5 Minutes Flow", type: "bodyweight" },
          { id: "p4_d4_2", name: "Full Body Mobility & Yoga Flow", target: "20 Minutes Flow", type: "bodyweight" },
        ]
      }
    }
  }
];

const EQUIPMENT_OPTIONS: EquipmentItem[] = [
  '14kg Weight Vest',
  'Gymnastic Rings',
  'Parallettes',
  'Dip Belt & Weights',
  'Pull-up Bar',
  'Resistance Bands',
  'Chalk & Wrist Wraps',
];

interface LogState {
  [key: string]: {
    weight: string;
    set1: string;
    set2: string;
    set3: string;
    set4: string;
  };
}

interface NutritionState {
  [key: string]: {
    shake: boolean;
    creatine: boolean;
  };
}

export default function TrackerPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'protocol' | 'calendar'>('protocol');

  // --- ORIGINAL 14KG PROTOCOL LOGIC ---
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeSelection, setActiveSelection] = useState<{
    week: number;
    day: string;
    phase: Phase;
  } | null>(null);

  const [logs, setLogs] = useState<LogState>({});
  const [nutrition, setNutrition] = useState<NutritionState>({});

  // Load local saved training logs
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('hypertrophy_protocol_logs_v1');
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      const savedNut = localStorage.getItem('hypertrophy_protocol_nutrition_v1');
      if (savedNut) setNutrition(JSON.parse(savedNut));
    } catch (e) {
      console.error("Failed loading logs", e);
    }
  }, []);

  const handleLogChange = (week: number, day: string, exId: string, field: string, value: string) => {
    const logKey = `week${week}_${day}_${exId}`;
    const updated = {
      ...logs,
      [logKey]: {
        ...(logs[logKey] || { weight: '', set1: '', set2: '', set3: '', set4: '' }),
        [field]: value
      }
    };
    setLogs(updated);
    localStorage.setItem('hypertrophy_protocol_logs_v1', JSON.stringify(updated));
  };

  const handleNutritionToggle = (week: number, day: string, type: 'shake' | 'creatine') => {
    const nutKey = `week${week}_${day}_nutrition`;
    const current = nutrition[nutKey] || { shake: false, creatine: false };
    const updated = {
      ...nutrition,
      [nutKey]: {
        ...current,
        [type]: !current[type]
      }
    };
    setNutrition(updated);
    localStorage.setItem('hypertrophy_protocol_nutrition_v1', JSON.stringify(updated));
  };

  // Compute Statistics
  const totalWorkoutsLogged = Object.keys(logs).filter(k => {
    const item = logs[k];
    return item.set1 || item.set2 || item.set3 || item.set4;
  }).length;

  const activePhase = PHASES[activePhaseIndex];

  // --- MONTHLY CALENDAR & BLOCK BUILDER LOGIC ---
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState('14kg Hypertrophy Block');
  const [newBlockCategory, setNewBlockCategory] = useState<Swimlane>('Push');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem[]>([
    '14kg Weight Vest',
    'Gymnastic Rings',
  ]);

  const { data: blocks = [] } = useQuery<WeekPlanBlock[]>({
    queryKey: ['tracker-blocks'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/tracker/blocks`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: calendar } = useQuery<MonthlyCalendarSchedule>({
    queryKey: ['tracker-calendar'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/tracker/calendar`);
      const json = await res.json();
      return json.data;
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ weekIndex, blockId }: { weekIndex: number; blockId: string | null }) => {
      const res = await fetch(`${API_BASE}/tracker/calendar/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekIndex, blockId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-calendar'] });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async (newBlockData: any) => {
      const res = await fetch(`${API_BASE}/tracker/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlockData),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-blocks'] });
      setIsBuilderOpen(false);
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/tracker/blocks/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['tracker-calendar'] });
    },
  });

  const handleDragStart = (blockId: string) => setDraggedBlockId(blockId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (weekIndex: number) => {
    if (draggedBlockId) {
      scheduleMutation.mutate({ weekIndex, blockId: draggedBlockId });
      setDraggedBlockId(null);
    }
  };

  const toggleEquipment = (item: EquipmentItem) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== item));
    } else {
      setSelectedEquipment([...selectedEquipment, item]);
    }
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    createBlockMutation.mutate({
      name: newBlockName,
      description: `Custom ${newBlockCategory} training block with 14kg weighted progressions.`,
      category: newBlockCategory,
      focusGoal: 'Hypertrophy & Progressive Overload',
      equipmentRequired: selectedEquipment,
      days: [
        { dayName: 'Monday', isRestDay: false, routineTitle: `${newBlockCategory} Power & Volume`, exerciseIds: ['ex_2', 'ex_3'], sets: [{ setNumber: 1, reps: 8, weightKg: 14, rpe: 8, restSeconds: 120 }], equipmentRequired: selectedEquipment },
        { dayName: 'Tuesday', isRestDay: false, routineTitle: 'Secondary Skill Holds', exerciseIds: ['ex_0'], sets: [{ setNumber: 1, reps: 10, weightKg: 0, rpe: 7, restSeconds: 90 }], equipmentRequired: selectedEquipment },
        { dayName: 'Wednesday', isRestDay: true, routineTitle: 'Active Recovery', exerciseIds: [], sets: [], equipmentRequired: [] },
        { dayName: 'Thursday', isRestDay: false, routineTitle: 'Volume Progression', exerciseIds: ['ex_101'], sets: [{ setNumber: 1, reps: 8, weightKg: 14, rpe: 8, restSeconds: 120 }], equipmentRequired: selectedEquipment },
        { dayName: 'Friday', isRestDay: false, routineTitle: 'Core & Compression', exerciseIds: ['ex_151'], sets: [{ setNumber: 1, reps: 12, weightKg: 0, rpe: 7, restSeconds: 60 }], equipmentRequired: [] },
        { dayName: 'Saturday', isRestDay: true, routineTitle: 'Rest', exerciseIds: [], sets: [], equipmentRequired: [] },
        { dayName: 'Sunday', isRestDay: true, routineTitle: 'Rest', exerciseIds: [], sets: [], equipmentRequired: [] },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Header activeView="stats" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Page Hero & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                14kg Weighted <span className="text-blue-500">Hypertrophy Protocol</span>
              </h1>
            </div>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl">
              12-Week Progressive Overload Mesocycle tailored for 14kg Vest & Gymnastic Rings mastery. Log your daily workout sets, reps, load, and nutrition surplus!
            </p>
          </div>

          {/* Navigation Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('protocol')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'protocol'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              14kg Training Plan
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Drag & Drop Monthly Schedule
            </button>
          </div>
        </div>

        {/* --- TAB 1: ORIGINAL 14KG HYPERTROPHY PROTOCOL PLAN & LOGS --- */}
        {activeTab === 'protocol' && (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{totalWorkoutsLogged}</div>
                  <div className="text-xs text-slate-400 font-medium">Logged Sessions</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">14 kg</div>
                  <div className="text-xs text-slate-400 font-medium">Target Vest Load</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Phase {activePhase.phase}</div>
                  <div className="text-xs text-slate-400 font-medium">Active Phase</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">12 Weeks</div>
                  <div className="text-xs text-slate-400 font-medium">Total Protocol</div>
                </div>
              </div>
            </div>

            {/* Phase Selector Tabs */}
            <div className="flex flex-wrap gap-3">
              {PHASES.map((p, idx) => (
                <button
                  key={p.phase}
                  onClick={() => {
                    setActivePhaseIndex(idx);
                    setSelectedWeek(p.weeks[0]);
                  }}
                  className={`flex-1 min-w-[240px] text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    activePhaseIndex === idx
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-blue-400 uppercase tracking-widest">
                    PHASE 0{p.phase}
                  </div>
                  <div className="text-sm font-extrabold text-white mt-1">{p.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.subtitle}</div>
                </button>
              ))}
            </div>

            {/* Week Selector Pills */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3">
                Select Week:
              </span>
              <div className="flex flex-wrap gap-2">
                {activePhase.weeks.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      selectedWeek === w
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(activePhase.workoutPlan).map(([dayKey, dayPlan]) => {
                const logCountForDay = dayPlan.exercises.filter((ex) => {
                  const logKey = `week${selectedWeek}_${dayKey}_${ex.id}`;
                  const l = logs[logKey];
                  return l && (l.set1 || l.set2 || l.set3 || l.set4);
                }).length;

                return (
                  <div
                    key={dayKey}
                    className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition shadow-xl"
                  >
                    <div className="p-5 border-b border-slate-800 bg-slate-950/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider">
                          {dayKey}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {logCountForDay} / {dayPlan.exercises.length} Done
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-1.5 leading-snug">
                        {dayPlan.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{dayPlan.focus}</p>
                    </div>

                    <div className="p-5 flex-1 space-y-3">
                      {dayPlan.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200">{ex.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ex.target}</div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              ex.type === 'weighted'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : ex.type === 'dumbbell'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {ex.type}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-950/80">
                      <button
                        onClick={() =>
                          setActiveSelection({
                            week: selectedWeek,
                            day: dayKey,
                            phase: activePhase,
                          })
                        }
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition active:scale-95 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Log Day Workout</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 2: DRAG & DROP MONTHLY CALENDAR & BLOCK BUILDER --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Saved Week Plan Blocks Palette */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-orange-400" />
                    Week Plan Blocks
                  </h2>
                  <button
                    onClick={() => setIsBuilderOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Block
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  💡 Drag any block below and drop it onto a calendar week to schedule your mesocycle!
                </p>

                <div className="space-y-4">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(block.id)}
                      className="group relative bg-slate-900 border border-slate-800 hover:border-orange-500/50 p-5 rounded-xl shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                          <div>
                            <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors">
                              {block.name}
                            </h3>
                            <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              {block.category} Swimlane
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteBlockMutation.mutate(block.id)}
                          className="text-slate-600 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-slate-400 line-clamp-2">
                        {block.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                        {block.equipmentRequired.map((equip) => (
                          <span
                            key={equip}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50"
                          >
                            <Dumbbell className="w-3 h-3 text-amber-400" />
                            {equip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Monthly Calendar View */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-400" />
                    Monthly Schedule — August 2026
                  </h2>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                    Mesocycle Active
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {calendar?.weeks.map((week) => {
                    const assignedBlock = blocks.find((b) => b.id === week.assignedBlockId);

                    return (
                      <div
                        key={week.weekIndex}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(week.weekIndex)}
                        className={`relative p-6 rounded-2xl border transition-all duration-200 ${
                          assignedBlock
                            ? 'bg-slate-900/90 border-orange-500/40 shadow-lg shadow-orange-500/5'
                            : 'bg-slate-900/30 border-dashed border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl font-mono">
                              <span className="text-[10px] uppercase text-slate-400 font-bold">Week</span>
                              <span className="text-2xl font-extrabold text-orange-400">0{week.weekIndex}</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-lg">
                                  {assignedBlock ? assignedBlock.name : 'Unassigned Week'}
                                </h3>
                                {week.isCompleted && (
                                  <span className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {assignedBlock
                                  ? assignedBlock.focusGoal
                                  : 'Drag a Week Plan Block from the left panel and drop here to assign.'}
                              </p>
                            </div>
                          </div>

                          {assignedBlock ? (
                            <button
                              onClick={() => scheduleMutation.mutate({ weekIndex: week.weekIndex, blockId: null })}
                              className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer"
                            >
                              Unassign Block
                            </button>
                          ) : (
                            <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-slate-600" />
                              Drop Block Here
                            </div>
                          )}
                        </div>

                        {assignedBlock && (
                          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                            {assignedBlock.days.map((day) => (
                              <div
                                key={day.dayName}
                                className={`p-2.5 rounded-lg border text-center ${
                                  day.isRestDay
                                    ? 'bg-slate-950/50 border-slate-900 text-slate-500'
                                    : 'bg-slate-800/60 border-slate-700/50 text-slate-200'
                                }`}
                              >
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  {day.dayName.slice(0, 3)}
                                </span>
                                <span className="text-xs font-semibold block truncate mt-1">
                                  {day.isRestDay ? 'Rest' : day.routineTitle.split(' ')[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Builder Modal */}
            {isBuilderOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                      Create Week Plan Block
                    </h3>
                    <button onClick={() => setIsBuilderOpen(false)} className="text-slate-400 hover:text-white p-1">
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateBlock} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Block Title
                      </label>
                      <input
                        type="text"
                        value={newBlockName}
                        onChange={(e) => setNewBlockName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Swimlane Focus
                      </label>
                      <select
                        value={newBlockCategory}
                        onChange={(e) => setNewBlockCategory(e.target.value as Swimlane)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="Push">Push Swimlane</option>
                        <option value="Pull">Pull Swimlane</option>
                        <option value="Core">Core Swimlane</option>
                        <option value="Legs">Legs Swimlane</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Required Equipment & Tools
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((equip) => {
                          const isSelected = selectedEquipment.includes(equip);
                          return (
                            <button
                              key={equip}
                              type="button"
                              onClick={() => toggleEquipment(equip)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {equip}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsBuilderOpen(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/20"
                      >
                        Save Block
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- EXERCISE LOGGING DRAWER MODAL FOR 14KG PROTOCOL --- */}
        {activeSelection && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-blue-400 uppercase tracking-widest mb-1">
                    <span>PHASE {activeSelection.phase.phase}</span>
                    <span>•</span>
                    <span>WEEK {activeSelection.week}</span>
                    <span>•</span>
                    <span>{activeSelection.day}</span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    {activeSelection.phase.workoutPlan[activeSelection.day]?.title}
                  </h2>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                    Target Vest Load: {activeSelection.phase.vestLoad}
                  </div>
                </div>

                <button
                  onClick={() => setActiveSelection(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exercise List Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeSelection.phase.workoutPlan[activeSelection.day]?.exercises.map((ex) => {
                  const logKey = `week${activeSelection.week}_${activeSelection.day}_${ex.id}`;
                  const currentLog = logs[logKey] || { weight: '', set1: '', set2: '', set3: '', set4: '' };
                  const isBodyweight = ex.type === 'bodyweight';

                  return (
                    <div key={ex.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div>
                          <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">Target: {ex.target}</span>
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
                        <label className="text-slate-400 font-medium">Vest / Load (kg):</label>
                        <input
                          type="number"
                          disabled={isBodyweight}
                          placeholder={isBodyweight ? "0" : "Vest kg"}
                          value={isBodyweight ? "0" : currentLog.weight}
                          onChange={(e) => handleLogChange(activeSelection.week, activeSelection.day, ex.id, 'weight', e.target.value)}
                          className={`w-24 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold text-center transition ${
                            isBodyweight
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-slate-900 border-slate-800 text-white focus:border-blue-500 focus:outline-none'
                          }`}
                        />
                      </div>

                      {/* Reps Input Grid (4 Sets) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Set Reps Log:
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['set1', 'set2', 'set3', 'set4'] as const).map((setKey, idx) => (
                            <div key={setKey} className="flex flex-col gap-1 text-center">
                              <span className="text-[10px] text-slate-500 font-mono">S{idx + 1}</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={currentLog[setKey]}
                                onChange={(e) => handleLogChange(activeSelection.week, activeSelection.day, ex.id, setKey, e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-center text-white focus:border-blue-500 focus:outline-none transition"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Nutrition Checklist */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Daily Nutrition Checklist
                  </div>

                  {(() => {
                    const nutKey = `week${activeSelection.week}_${activeSelection.day}_nutrition`;
                    const currentNut = nutrition[nutKey] || { shake: false, creatine: false };

                    return (
                      <div className="space-y-2.5 text-xs text-slate-300">
                        <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                          <input
                            type="checkbox"
                            checked={currentNut.shake}
                            onChange={() => handleNutritionToggle(activeSelection.week, activeSelection.day, 'shake')}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          />
                          <span className="font-medium">Drank Serious Mass Shake (+250 Cal Surplus)</span>
                        </label>

                        <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                          <input
                            type="checkbox"
                            checked={currentNut.creatine}
                            onChange={() => handleNutritionToggle(activeSelection.week, activeSelection.day, 'creatine')}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          />
                          <span className="font-medium">Took 5g Creatine Monohydrate</span>
                        </label>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Drawer Footer Save Button */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md">
                <button
                  onClick={() => setActiveSelection(null)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Close</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
