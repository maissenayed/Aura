import { Exercise, Swimlane } from '../types/exercise';

// Full list of 120+ Calisthenics Exercises
const rawExercises = [
  { "id": "ex_0", "name": "Wall HS", "level": 1, "category": "Handstands", "subCategory": "Handstands", "steps": ["Place your hands flat on the floor shoulder-width apart with fingers spread wide.", "Walk your feet up a wall (or kick up gently) until your legs are straight above you.", "Squeeze your stomach and glutes tightly so your body is rigid like a board.", "Keep your arms locked completely straight and push the floor away aggressively."], "expertTip": "Look right between your hands to keep your balance, and grip the floor with your fingertips." },
  { "id": "ex_1", "name": "Pike HeSPU", "level": 1, "category": "Handstands", "subCategory": "Handstand Pushups", "steps": ["Place your hands on the floor or a sturdy surface slightly wider than shoulder-width.", "Step your feet back so your body forms a piked V shape.", "Bend your elbows to slowly lower your head forward toward the floor.", "Push strongly through your palms to straighten your arms."], "expertTip": "Keep your elbows pointing diagonally backward (like an arrow), not flared out." },
  { "id": "ex_2", "name": "Tuck L-sit", "level": 1, "category": "Handstands", "subCategory": "L, Str-L, V, Manna", "steps": ["Sit on the floor with your hands flat next to your hips.", "Lock your arms straight and push your shoulders down.", "Squeeze your abs and tuck your knees into your chest to lift your butt and legs."], "expertTip": "If this is too hard, practice lifting your butt off the ground with heels touching." },
  { "id": "ex_3", "name": "German Hang", "level": 1, "category": "Pulling", "subCategory": "Back Lever", "steps": ["Grab pull-up bar or rings with both hands.", "Pass your feet through your arms into an inverted hang.", "Lower your feet toward the floor behind you into a deep shoulder extension stretch."], "expertTip": "Keep your core engaged and arms straight throughout the stretch." },
  { "id": "ex_4", "name": "Row Ecc", "level": 1, "category": "Pulling", "subCategory": "Rows", "steps": ["Lean back under rings or a waist-high bar.", "Pull chest up to the bar.", "Lower yourself down over 5 seconds as slowly as possible."], "expertTip": "Keep your hips pushed up; don't let your butt sag." },
  { "id": "ex_5", "name": "Jump Pull-ups", "level": 1, "category": "Pulling", "subCategory": "Pull-ups", "steps": ["Stand under a bar, jump up to get your chin over the bar.", "Lower yourself down slowly under control."], "expertTip": "Focus on controlled 3-second descent." },
  { "id": "ex_7", "name": "Regular Pushups", "level": 1, "category": "Pushing", "subCategory": "Pushups", "steps": ["Place hands shoulder-width apart, body in a rigid plank.", "Lower chest until it hovers above the floor.", "Press back up to full arm extension."], "expertTip": "Tuck elbows at 45-degree angle." },
  { "id": "ex_8", "name": "PB Jump Dips", "level": 1, "category": "Pushing", "subCategory": "Dips / OA Dips", "steps": ["Jump up on parallel bars to support position.", "Lower down until elbows bend to 90 degrees.", "Press back up to straight arms."], "expertTip": "Keep shoulders depressed away from ears." },
  { "id": "ex_9", "name": "Support Hold", "level": 1, "category": "Pushing", "subCategory": "Ring Dips", "steps": ["Hold bodyweight on gymnastic rings with straight arms.", "Keep rings turned out (RTO) for stability."], "expertTip": "Pin rings close to hips." },
  { "id": "ex_11", "name": "Parallel Squat", "level": 1, "category": "Miscellaneous", "subCategory": "Squats", "steps": ["Stand feet shoulder-width apart.", "Squat down until thighs are parallel to the floor.", "Drive up through heels."], "expertTip": "Keep chest high and knees aligned with toes." },
  { "id": "ex_12", "name": "Glute Bridge", "level": 1, "category": "Other", "subCategory": "Glute Bridge / Hip Thrusts" },
  { "id": "ex_13", "name": "2 Leg hamstring slide", "level": 1, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_14", "name": "Lunges", "level": 1, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_15", "name": "Floor tuck raises", "level": 1, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_16", "name": "Floor tuck raises", "level": 1, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_17", "name": "Wall HS (Adv)", "level": 2, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_18", "name": "Box HeSPU", "level": 2, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_19", "name": ".3x BW Press", "level": 2, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_20", "name": "1 Leg Bent L-sit", "level": 2, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_21", "name": "Skin the Cat", "level": 2, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_22", "name": "Ring Rows", "level": 2, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_23", "name": "Bar Pull-up Ecc", "level": 2, "category": "Pulling", "subCategory": "Pull-ups" },
  { "id": "ex_24", "name": "Assisted Pull-ups", "level": 2, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_25", "name": "Kip Pull-ups", "level": 2, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_26", "name": "Diamond Pushups", "level": 2, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_27", "name": "PB Dips Ecc", "level": 2, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_28", "name": "RTO Support", "level": 2, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_29", "name": "Assisted Dips", "level": 2, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_30", "name": "25s Plank", "level": 2, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_31", "name": "(Backward = Bwd)", "level": 2, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_32", "name": "Full Squat", "level": 2, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_33", "name": "Elevated Shld Hip Thrust", "level": 2, "category": "Other", "subCategory": "Glute Bridge / Hip Thrusts" },
  { "id": "ex_34", "name": "1 Leg hamstring slide ecc", "level": 2, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_35", "name": "Split Squat (Chair)", "level": 2, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_36", "name": "Full tuck R Hypers", "level": 2, "category": "Other", "subCategory": "Reverse Hyperextensions" },
  { "id": "ex_37", "name": "FL straight leg raise", "level": 2, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_38", "name": "FL straight leg raise", "level": 2, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_39", "name": "Wall HS (Strict)", "level": 3, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_40", "name": "Wall HeSPU Ecc", "level": 3, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_41", "name": ".43x BW Press", "level": 3, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_42", "name": "L-sit", "level": 3, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_43", "name": "Tuck BL", "level": 3, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_44", "name": "Wide Rows", "level": 3, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_45", "name": "Bar Pull-ups", "level": 3, "category": "Pulling", "subCategory": "Pull-ups" },
  { "id": "ex_46", "name": "1x Bodyweight Pull", "level": 3, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_47", "name": "Bar Pull-ups (Explosive)", "level": 3, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_48", "name": "Frog Stand", "level": 3, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_49", "name": "Ring wide PU", "level": 3, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_50", "name": "PB Dips", "level": 3, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_51", "name": "R Dips Ecc", "level": 3, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_52", "name": "Weighted Dips (+10kg)", "level": 3, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_53", "name": "MU Negatives", "level": 3, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_54", "name": "60s Plank", "level": 3, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_55", "name": "Side to Side Squat", "level": 3, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_56", "name": "1 Leg Glute Bridge", "level": 3, "category": "Other", "subCategory": "Glute Bridge / Hip Thrusts" },
  { "id": "ex_57", "name": "1 Leg hamstring slide", "level": 3, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_58", "name": "Beginner Shrimp", "level": 3, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_59", "name": "90 Deg Bent Knee R Hypers", "level": 3, "category": "Other", "subCategory": "Reverse Hyperextensions" },
  { "id": "ex_60", "name": "Hang Bent Leg Toes to bar", "level": 3, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_61", "name": "Tuck Eccentric DF", "level": 3, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_62", "name": "Free HS", "level": 4, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_63", "name": "Wall HeSPU", "level": 4, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_64", "name": ".55x BW Press", "level": 4, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_65", "name": "Straddle L-sit", "level": 4, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_66", "name": "Adv Tuck BL", "level": 4, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_67", "name": "Tuck FL", "level": 4, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_68", "name": "Archer Rows", "level": 4, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_69", "name": "L-Pull-ups", "level": 4, "category": "Pulling", "subCategory": "Pull-ups" },
  { "id": "ex_70", "name": "R L-Pull-ups", "level": 4, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_71", "name": "1.18x Bodyweight Pull", "level": 4, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_72", "name": "Kip Clap Pull-ups", "level": 4, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_73", "name": "SA Frog Stand", "level": 4, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_74", "name": "Rings Frog Stand", "level": 4, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_75", "name": "Ring PU", "level": 4, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_76", "name": "L-Dips", "level": 4, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_77", "name": "R Dips", "level": 4, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_78", "name": "1.2x BW Dip", "level": 4, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_79", "name": "Kipping MU", "level": 4, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_80", "name": "1 Arm 1 Leg Plank", "level": 4, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_81", "name": "Pistol Squat", "level": 4, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_82", "name": "Ele Shld 1 Leg Hip Thrust", "level": 4, "category": "Other", "subCategory": "Glute Bridge / Hip Thrusts" },
  { "id": "ex_83", "name": "Hip Hinge Vertical Thighs", "level": 4, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_84", "name": "Intermediate Shrimp", "level": 4, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_85", "name": "Full Reverse Hypers", "level": 4, "category": "Other", "subCategory": "Reverse Hyperextensions" },
  { "id": "ex_86", "name": "Hang Str Leg Toes to bar", "level": 4, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_87", "name": "Adv Tuck DF", "level": 4, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_88", "name": "Natural leg extension", "level": 4, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_89", "name": "Shld Front of Wrist Dip", "level": 4, "category": "Other", "subCategory": "Impossible dip" },
  { "id": "ex_90", "name": "Free HS (Hold)", "level": 5, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_91", "name": "R Shld Std", "level": 5, "category": "Handstands", "subCategory": "Rings HS" },
  { "id": "ex_92", "name": "Wall HSPU", "level": 5, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_93", "name": ".68x BW Press", "level": 5, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_94", "name": "BA BB Press", "level": 5, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_95", "name": "Wall Str Press Ecc", "level": 5, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_96", "name": "RTO L-sit", "level": 5, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_97", "name": "Straddle BL", "level": 5, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_98", "name": "Adv Tuck FL", "level": 5, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_99", "name": "Tuck FL Rows", "level": 5, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_100", "name": "Archer-in-Rows", "level": 5, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_101", "name": "Bar Pullover", "level": 5, "category": "Pulling", "subCategory": "Pull-ups" },
  { "id": "ex_102", "name": "R Wide Pull-ups", "level": 5, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_103", "name": "1.35x Bodyweight Pull", "level": 5, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_104", "name": "Non-Kip Clapping", "level": 5, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_105", "name": "Tuck PL", "level": 5, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_106", "name": "Rings SA Frog Stand", "level": 5, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_107", "name": "RTO Pushups", "level": 5, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_108", "name": "Elevated OA PU", "level": 5, "category": "Pushing", "subCategory": "One Arm Pushups" },
  { "id": "ex_109", "name": "45 Deg Dips", "level": 5, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_110", "name": "R L-Dips", "level": 5, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_111", "name": "1.38x BW Dip", "level": 5, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_112", "name": "Strict Muscle-up", "level": 5, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_113", "name": "Two-Arm EL", "level": 5, "category": "Miscellaneous", "subCategory": "Elbow Levers" },
  { "id": "ex_114", "name": "Tuck Flag", "level": 5, "category": "Miscellaneous", "subCategory": "Flag" },
  { "id": "ex_115", "name": "Knees Ab Wheel", "level": 5, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_116", "name": "RTO L-Sit Hold", "level": 5, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_117", "name": "Felge Fwd Tuck Support", "level": 5, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_118", "name": "1.2x BW Pistol", "level": 5, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_119", "name": "Weighted Hip Thrusts", "level": 5, "category": "Other", "subCategory": "Glute Bridge / Hip Thrusts" },
  { "id": "ex_120", "name": "Hamstring Eccentric Ground", "level": 5, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_121", "name": "Advanced Shrimp", "level": 5, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_122", "name": "Weighted R. Hypers", "level": 5, "category": "Other", "subCategory": "Reverse Hyperextensions" },
  { "id": "ex_123", "name": "Windshield wipers / 360", "level": 5, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_124", "name": "One Leg Straddle DF", "level": 5, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_125", "name": "Incline pelican curl", "level": 5, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_126", "name": "Sissy squat", "level": 5, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_127", "name": "OA Handstand Prep", "level": 6, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_128", "name": "R Strap HS", "level": 6, "category": "Handstands", "subCategory": "Rings HS" },
  { "id": "ex_129", "name": "Free HeSPU", "level": 6, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_130", "name": ".8x BW Press", "level": 6, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_131", "name": "L-Sit BA BB Press", "level": 6, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_132", "name": "Chair Press HS", "level": 6, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_133", "name": "Ele Str Std Str Press", "level": 6, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_134", "name": "45 deg V-sit", "level": 6, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_135", "name": "Half Lay 1 Leg BL", "level": 6, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_136", "name": "Straddle FL", "level": 6, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_137", "name": "Adv Tuck FL Rows", "level": 6, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_138", "name": "Str OA Rows", "level": 6, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_139", "name": "R Wide L-Pull-ups", "level": 6, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_140", "name": "1.50x Bodyweight Pull", "level": 6, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_141", "name": "L-Clap Pull-ups", "level": 6, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_142", "name": "Adv Tuck PL", "level": 6, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_143", "name": "Rings Tuck PL", "level": 6, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_144", "name": "Tuck PL PU", "level": 6, "category": "Pushing", "subCategory": "PB/FL PL Pushups" },
  { "id": "ex_145", "name": "RTO Archer PU", "level": 6, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_146", "name": "Straddle OA PU", "level": 6, "category": "Pushing", "subCategory": "One Arm Pushups" },
  { "id": "ex_147", "name": "Wall BB OA Dips", "level": 6, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_148", "name": "R Wide Dips", "level": 6, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_149", "name": "1.55x BW Dip", "level": 6, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_150", "name": "Wide / No FG MU", "level": 6, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_151", "name": "R Two-Arm EL", "level": 6, "category": "Miscellaneous", "subCategory": "Elbow Levers" },
  { "id": "ex_152", "name": "Adv Tuck Flag", "level": 6, "category": "Miscellaneous", "subCategory": "Flag" },
  { "id": "ex_153", "name": "Ab Wheel Ramp", "level": 6, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_154", "name": "RTO Str-L", "level": 6, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_155", "name": "Kip to Support", "level": 6, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_156", "name": "Felge Fwd Pike", "level": 6, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_157", "name": "1.35x BW Pistol", "level": 6, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_158", "name": "Full Nordic Ham Curl", "level": 6, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_159", "name": "2 Hand Shrimp", "level": 6, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_160", "name": "Ankle Weight Toes Bar", "level": 6, "category": "Other", "subCategory": "Hanging Leg Raises" },
  { "id": "ex_161", "name": "Full Dragon Flag", "level": 6, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_162", "name": "Pelican curl", "level": 6, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_163", "name": "Matrix squat to floor", "level": 6, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_164", "name": "R HS Hold", "level": 7, "category": "Handstands", "subCategory": "Rings HS" },
  { "id": "ex_165", "name": "Free HSPU (Full)", "level": 7, "category": "Handstands", "subCategory": "Handstand Pushups" },
  { "id": "ex_166", "name": "R Wide HSPU", "level": 7, "category": "Handstands", "subCategory": "Rings HSPU" },
  { "id": "ex_167", "name": ".9x BW Press", "level": 7, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_168", "name": "CR SB Press", "level": 7, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_169", "name": "Chair Illusion Press", "level": 7, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_170", "name": "Str Pike Std Press", "level": 7, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_171", "name": "75 deg V-sit", "level": 7, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_172", "name": "Full BL", "level": 7, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_173", "name": "1 Leg FL", "level": 7, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_174", "name": "Adv Tuck RC", "level": 7, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_175", "name": "OA Rows", "level": 7, "category": "Pulling", "subCategory": "Rows" },
  { "id": "ex_176", "name": "R Archer Pull-ups", "level": 7, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_177", "name": "1.65x Bodyweight Pull", "level": 7, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_178", "name": "Kip BTB Clap", "level": 7, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_179", "name": "RTO 40 Deg PPPU", "level": 7, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_180", "name": "Rings Str OA PU", "level": 7, "category": "Pushing", "subCategory": "One Arm Pushups" },
  { "id": "ex_181", "name": "Side BB OA Dips", "level": 7, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_182", "name": "RTO 45 Deg Dips", "level": 7, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_183", "name": "1.7x BW Dip", "level": 7, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_184", "name": "Strict Bar MU", "level": 7, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_185", "name": "OA Straddle EL", "level": 7, "category": "Miscellaneous", "subCategory": "Elbow Levers" },
  { "id": "ex_186", "name": "Straddle Flag", "level": 7, "category": "Miscellaneous", "subCategory": "Flag" },
  { "id": "ex_187", "name": "Ab Wheel Eccentric", "level": 7, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_188", "name": "Rings Back Lever", "level": 7, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_189", "name": "Back Kip to Support", "level": 7, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_190", "name": "Felge Bwd Pike Support", "level": 7, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_191", "name": "1.5x BW Pistol", "level": 7, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_192", "name": "Nordic Arms Overhead", "level": 7, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_193", "name": "Deficit Adv Shrimp", "level": 7, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_194", "name": "Weighted Dragon Flag", "level": 7, "category": "Other", "subCategory": "Dragon Flag" },
  { "id": "ex_195", "name": "Feet elevated Pelican", "level": 7, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_196", "name": "Elevated Matrix squat", "level": 7, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_197", "name": "Shld Behind Wrist Dip", "level": 7, "category": "Other", "subCategory": "Impossible dip" },
  { "id": "ex_198", "name": "R Strap HSPU", "level": 8, "category": "Handstands", "subCategory": "Rings HSPU" },
  { "id": "ex_199", "name": "1x BW Press", "level": 8, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_200", "name": "BA SB Press", "level": 8, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_201", "name": "R BA BB Press", "level": 8, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_202", "name": "Str-L Str Press", "level": 8, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_203", "name": "100 deg V-sit", "level": 8, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_204", "name": "BL Pullout", "level": 8, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_205", "name": "Full FL Hold", "level": 8, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_206", "name": "Straddle FL Rows", "level": 8, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_207", "name": "OAC Eccentric", "level": 8, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_208", "name": "1.78x Bodyweight Pull", "level": 8, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_209", "name": "L-Slap Abs", "level": 8, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_210", "name": "Straddle PL", "level": 8, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_211", "name": "Rings Adv Tuck PL", "level": 8, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_212", "name": "Adv Tuck PL PU", "level": 8, "category": "Pushing", "subCategory": "PB/FL PL Pushups" },
  { "id": "ex_213", "name": "Tuck PL PU Rings", "level": 8, "category": "Pushing", "subCategory": "Rings PL Pushups" },
  { "id": "ex_214", "name": "RTO 60 Deg PPPU", "level": 8, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_215", "name": "Straight Body OA PU", "level": 8, "category": "Pushing", "subCategory": "One Arm Pushups" },
  { "id": "ex_216", "name": "Wall SB OA Dips", "level": 8, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_217", "name": "RTO 75 Deg Dips", "level": 8, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_218", "name": "1.85x BW Dip", "level": 8, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_219", "name": "SFL MU ATPL", "level": 8, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_220", "name": "OA SB EL", "level": 8, "category": "Miscellaneous", "subCategory": "Elbow Levers" },
  { "id": "ex_221", "name": "Full Human Flag", "level": 8, "category": "Miscellaneous", "subCategory": "Flag" },
  { "id": "ex_222", "name": "Full Ab Wheel", "level": 8, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_223", "name": "Rings Front Lever", "level": 8, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_224", "name": "1.65x BW Pistol", "level": 8, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_225", "name": "Weighted Nordic Ham Curl", "level": 8, "category": "Other", "subCategory": "Natural Ham Curl / Nordic Curl" },
  { "id": "ex_226", "name": "Deficit 2H Shrimp", "level": 8, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_227", "name": "Hefesto negative", "level": 8, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_228", "name": "1 Leg Matrix Squat", "level": 8, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_229", "name": "OA back lever", "level": 8, "category": "Other", "subCategory": "One arm statics" },
  { "id": "ex_230", "name": "Shld Above Elbow Dip", "level": 8, "category": "Other", "subCategory": "Impossible dip" },
  { "id": "ex_231", "name": "R Free HSPU", "level": 9, "category": "Handstands", "subCategory": "Rings HSPU" },
  { "id": "ex_232", "name": "1.08x BW Press", "level": 9, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_233", "name": "HS EL HS Press", "level": 9, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_234", "name": "R Dip to HS", "level": 9, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_235", "name": "L-sit Pike Press", "level": 9, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_236", "name": "120 deg V-sit", "level": 9, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_237", "name": "GH Pullout", "level": 9, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_238", "name": "FL to Inverted", "level": 9, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_239", "name": "Str FL Rows", "level": 9, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_240", "name": "One Arm Chinup (OAC)", "level": 9, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_241", "name": "1.9x Bodyweight Pull", "level": 9, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_242", "name": "L-Slap Thighs", "level": 9, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_243", "name": "Iron Cross Progressions", "level": 9, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_244", "name": "Half Lay Planche", "level": 9, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_245", "name": "RTO Maltese PU", "level": 9, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_246", "name": "Rings SB OA PU", "level": 9, "category": "Pushing", "subCategory": "One Arm Pushups" },
  { "id": "ex_247", "name": "Side SB OA Dips", "level": 9, "category": "Pushing", "subCategory": "Dips / OA Dips" },
  { "id": "ex_248", "name": "RTO 90 Deg Dips", "level": 9, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_249", "name": "2x BW Dip", "level": 9, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_250", "name": "OA Straight MU", "level": 9, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_251", "name": "Ab Wheel + 20 lbs", "level": 9, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_252", "name": "R 90 Deg V-Sit", "level": 9, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_253", "name": "SA Kip to L-Sit", "level": 9, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_254", "name": "1.8x BW Pistol", "level": 9, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_255", "name": "Weighted Ele Shrimp", "level": 9, "category": "Other", "subCategory": "Shrimp Squat" },
  { "id": "ex_256", "name": "Hefesto (GH pullout)", "level": 9, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_257", "name": "Protracted VC Bars", "level": 9, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_258", "name": "Natural 1 Leg Extension", "level": 9, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_259", "name": "One Arm Handstand", "level": 10, "category": "Handstands", "subCategory": "Handstands" },
  { "id": "ex_260", "name": "1.15x BW Press", "level": 10, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_261", "name": "PB Dip SB to HS", "level": 10, "category": "Handstands", "subCategory": "Press Handstands" },
  { "id": "ex_262", "name": "R BA SB Press", "level": 10, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_263", "name": "R SA L-sit Str Press", "level": 10, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_264", "name": "140 deg V-sit", "level": 10, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_265", "name": "BA Pull-up to BL", "level": 10, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_266", "name": "Hang Pull to Inv", "level": 10, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_267", "name": "Full FL Rows", "level": 10, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_268", "name": "OAC + 15 lbs", "level": 10, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_269", "name": "2x Bodyweight Pull", "level": 10, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_270", "name": "Reg Slap Thighs", "level": 10, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_271", "name": "Iron Cross Hold", "level": 10, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_272", "name": "Straddle PL Rings", "level": 10, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_273", "name": "Straddle PL PU", "level": 10, "category": "Pushing", "subCategory": "PB/FL PL Pushups" },
  { "id": "ex_274", "name": "Adv Tuck PL PU Rings", "level": 10, "category": "Pushing", "subCategory": "Rings PL Pushups" },
  { "id": "ex_275", "name": "Wall PPPU", "level": 10, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_276", "name": "RTO 90+30 Dips", "level": 10, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_277", "name": "2.13x BW Dip", "level": 10, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_278", "name": "Felge Bwd SB Support", "level": 10, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_279", "name": "One Arm Ab Wheel", "level": 10, "category": "Miscellaneous", "subCategory": "Ab Wheel" },
  { "id": "ex_280", "name": "Iron Cross / Str PL", "level": 10, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_281", "name": "SA Back Kip Support", "level": 10, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_282", "name": "Felge Fwd Straight Support", "level": 10, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_283", "name": "1.9x BW Pistol", "level": 10, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_284", "name": "Back lever hefesto", "level": 10, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_285", "name": "Dragon press", "level": 10, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_286", "name": "1 Leg Sissy Squat", "level": 10, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_287", "name": "Shld Behind Elbow Dip", "level": 10, "category": "Other", "subCategory": "Impossible dip" },
  { "id": "ex_288", "name": "1.2x BW Press", "level": 11, "category": "Handstands", "subCategory": "Press" },
  { "id": "ex_289", "name": "R HS EL HS", "level": 11, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_290", "name": "R SA Str-L Press", "level": 11, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_291", "name": "155 deg V-sit", "level": 11, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_292", "name": "HS Lower to BL", "level": 11, "category": "Pulling", "subCategory": "Back Lever" },
  { "id": "ex_293", "name": "Circle FL", "level": 11, "category": "Pulling", "subCategory": "Front Lever" },
  { "id": "ex_294", "name": "FL RC Rows", "level": 11, "category": "Pulling", "subCategory": "FL Rows" },
  { "id": "ex_295", "name": "OAC + 25 lbs", "level": 11, "category": "Pulling", "subCategory": "R Pull-ups + OAC" },
  { "id": "ex_296", "name": "2.1x Bodyweight Pull", "level": 11, "category": "Pulling", "subCategory": "Weighted Pull-ups" },
  { "id": "ex_297", "name": "Non-Kip BTB Clap", "level": 11, "category": "Pulling", "subCategory": "Explosive Pull-ups" },
  { "id": "ex_298", "name": "Cross to Back Lever", "level": 11, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_299", "name": "Full Planche", "level": 11, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_300", "name": "R Wall PPPU", "level": 11, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_301", "name": "RTO 90+50 Dips", "level": 11, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_302", "name": "2.25x BW Dip", "level": 11, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_303", "name": "FL MU Str PL", "level": 11, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_304", "name": "Back Kip to HS", "level": 11, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_305", "name": "Felge Bwd Str Support", "level": 11, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_306", "name": "2x BW Pistol", "level": 11, "category": "Miscellaneous", "subCategory": "Squats" },
  { "id": "ex_307", "name": "Archer hefesto", "level": 11, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_308", "name": "VC on bars", "level": 11, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_309", "name": "1 Leg Matrix Floor", "level": 11, "category": "Other", "subCategory": "Quad dominant moves" },
  { "id": "ex_310", "name": "R Dip SB to HS", "level": 12, "category": "Handstands", "subCategory": "Rings Press HS" },
  { "id": "ex_311", "name": "R SA Pike Press", "level": 12, "category": "Handstands", "subCategory": "Straight Arm Press HS" },
  { "id": "ex_312", "name": "170 deg V-sit", "level": 12, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_313", "name": "SA Str PL to HS", "level": 12, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_314", "name": "Half Lay PL Rings", "level": 12, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_315", "name": "Half Lay PL PU", "level": 12, "category": "Pushing", "subCategory": "PB/FL PL Pushups" },
  { "id": "ex_316", "name": "Straddle PL PU Rings", "level": 12, "category": "Pushing", "subCategory": "Rings PL Pushups" },
  { "id": "ex_317", "name": "Wall Maltese PU", "level": 12, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_318", "name": "RTO 90+65 Dips", "level": 12, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_319", "name": "Felge Bwd SB to HS", "level": 12, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_320", "name": "Felge Bwd Rings HS", "level": 12, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_321", "name": "Hand-on-wrist hefesto", "level": 12, "category": "Other", "subCategory": "Bodyweight bicep curls" },
  { "id": "ex_322", "name": "OA front lever", "level": 12, "category": "Other", "subCategory": "One arm statics" },
  { "id": "ex_323", "name": "Manna Hold", "level": 13, "category": "Handstands", "subCategory": "L, Str-L, V, Manna" },
  { "id": "ex_324", "name": "Iron Cross Pullouts", "level": 13, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_325", "name": "R Wall Maltese PU", "level": 13, "category": "Pushing", "subCategory": "Pushups" },
  { "id": "ex_326", "name": "RTO 90+75 Dips", "level": 13, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_327", "name": "SA Kip to Cross", "level": 13, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_328", "name": "Felge SA to Cross", "level": 13, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_329", "name": "Wide VC on bars", "level": 13, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_330", "name": "OA dragon press", "level": 13, "category": "Other", "subCategory": "One arm statics" },
  { "id": "ex_331", "name": "Hang Pull to Back Lever", "level": 14, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_332", "name": "R SA Str PL to HS", "level": 14, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_333", "name": "Full PL Rings", "level": 14, "category": "Pushing", "subCategory": "Rings Planche" },
  { "id": "ex_334", "name": "Full PL PU", "level": 14, "category": "Pushing", "subCategory": "PB/FL PL Pushups" },
  { "id": "ex_335", "name": "Half Lay PL PU Rings", "level": 14, "category": "Pushing", "subCategory": "Rings PL Pushups" },
  { "id": "ex_336", "name": "RTO 90+82 Dips", "level": 14, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_337", "name": "SB Rotation to HS", "level": 14, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_338", "name": "Full Planche Rings", "level": 14, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_339", "name": "Back Kip to Cross", "level": 14, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_345", "name": "Butterfly Mount MU", "level": 15, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_346", "name": "Back Kip Straddle PL", "level": 15, "category": "Miscellaneous", "subCategory": "Rings Kip Skills" },
  { "id": "ex_347", "name": "Felge Fwd SA SB HS", "level": 15, "category": "Miscellaneous", "subCategory": "Rings Felge Skills" },
  { "id": "ex_348", "name": "Ring VC (Victorian Cross)", "level": 15, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_349", "name": "Kowalik Dip (VC)", "level": 15, "category": "Other", "subCategory": "Impossible dip" },
  { "id": "ex_350", "name": "Support Hang to Cross", "level": 16, "category": "Pulling", "subCategory": "Iron Cross" },
  { "id": "ex_351", "name": "RSA PL to HS", "level": 16, "category": "Pushing", "subCategory": "Planche (PB/FL)" },
  { "id": "ex_352", "name": "Full PL PU Rings", "level": 16, "category": "Pushing", "subCategory": "Rings PL Pushups" },
  { "id": "ex_353", "name": "RTO 90+88 Dips", "level": 16, "category": "Pushing", "subCategory": "Ring Dips" },
  { "id": "ex_354", "name": "Maltese Hold Pro", "level": 16, "category": "Pushing", "subCategory": "Weighted Dips" },
  { "id": "ex_355", "name": "Elevator Muscle Up", "level": 16, "category": "Miscellaneous", "subCategory": "Muscle-ups / Inverted MUs" },
  { "id": "ex_356", "name": "Inverted Cross", "level": 16, "category": "Miscellaneous", "subCategory": "Rings Full Statics" },
  { "id": "ex_357", "name": "Floor VC Forearms", "level": 16, "category": "Other", "subCategory": "Victorian cross (VC) variations" },
  { "id": "ex_358", "name": "OA Planche (Titan)", "level": 16, "category": "Other", "subCategory": "One arm statics" }
];

// Helper to determine Swimlane from category and subCategory
export function getSwimlane(category: string, subCategory: string): Swimlane {
  const cat = category.toLowerCase();
  const sub = subCategory.toLowerCase();

  if (cat.includes('pushing') || sub.includes('pushups') || sub.includes('dips') || sub.includes('planche')) {
    return 'Push';
  }
  if (cat.includes('pulling') || sub.includes('pull-ups') || sub.includes('rows') || sub.includes('lever') || sub.includes('cross')) {
    return 'Pull';
  }
  if (sub.includes('squats') || sub.includes('glute') || sub.includes('ham') || sub.includes('shrimp') || sub.includes('quad')) {
    return 'Legs';
  }
  return 'Core';
}

// Generate enriched exercises with prerequisite chains within subcategories
export const EXERCISES: Exercise[] = (() => {
  const subCategoryGroups: Record<string, typeof rawExercises> = {};
  
  rawExercises.forEach(ex => {
    if (!subCategoryGroups[ex.subCategory]) {
      subCategoryGroups[ex.subCategory] = [];
    }
    subCategoryGroups[ex.subCategory].push(ex);
  });

  const prereqMap: Record<string, string[]> = {};

  Object.values(subCategoryGroups).forEach(group => {
    group.sort((a, b) => a.level - b.level);

    for (let i = 0; i < group.length; i++) {
      const current = group[i];
      const prereqs: string[] = [];

      if (i > 0) {
        const prev = group[i - 1];
        if (prev.level < current.level) {
          prereqs.push(prev.id);
        } else if (i > 1 && group[i - 2].level < current.level) {
          prereqs.push(group[i - 2].id);
        }
      }

      prereqMap[current.id] = prereqs;
    }
  });

  const crossBranchLinks: Record<string, string[]> = {
    'ex_48': ['ex_7'],
    'ex_79': ['ex_45', 'ex_50'],
    'ex_112': ['ex_45', 'ex_50'],
    'ex_67': ['ex_44'],
    'ex_43': ['ex_3'],
    'ex_210': ['ex_105'],
    'ex_205': ['ex_67'],
    'ex_323': ['ex_2'],
    'ex_240': ['ex_45'],
    'ex_348': ['ex_205'],
  };

  return rawExercises.map(raw => {
    const swimlane = getSwimlane(raw.category, raw.subCategory);
    const subCategoryPrereqs = prereqMap[raw.id] || [];
    const extraPrereqs = crossBranchLinks[raw.id] || [];
    const allPrereqs = Array.from(new Set([...subCategoryPrereqs, ...extraPrereqs]));

    let muscles: string[] = [];
    if (swimlane === 'Push') muscles = ['Chest', 'Front Delts', 'Triceps', 'Core'];
    else if (swimlane === 'Pull') muscles = ['Lats', 'Rhomboids', 'Biceps', 'Grip', 'Rear Delts'];
    else if (swimlane === 'Legs') muscles = ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'];
    else muscles = ['Abs', 'Obliques', 'Lower Back', 'Shoulders'];

    let req = `Master level ${Math.max(1, raw.level - 1)} prerequisites with strict execution.`;
    if (raw.level <= 3) {
      req = "Perform 3 sets of 12-15 clean repetitions or 20s hold.";
    } else if (raw.level <= 7) {
      req = "Perform 4 sets of 8-10 reps with full range of motion or 15s hold.";
    } else if (raw.level <= 12) {
      req = "Execute 5 sets of 5 controlled reps or 10s isometric hold.";
    } else {
      req = "Pro Level: Execute 5 sets of max effort holds/reps with pristine alignment.";
    }

    const defaultSteps = [
      `1. Position your body in the starting ${raw.name} setup with active tension.`,
      `2. Engage your core, keep your spine aligned, and maintain steady breathing.`,
      `3. Complete the movement under full control with zero momentum.`,
      `4. Return steadily to the starting position.`
    ];

    const youtubeQuery = (raw as any).youtubeQuery || `${raw.name} calisthenics form tutorial`;
    const videoSearchUrl = (raw as any).videoSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

    return {
      id: raw.id,
      name: raw.name,
      level: Math.min(20, Math.max(1, raw.level)),
      category: raw.category,
      subCategory: raw.subCategory,
      swimlane,
      prerequisites: allPrereqs,
      unlockRequirements: req,
      description: raw.steps || defaultSteps,
      expertTip: raw.expertTip,
      youtubeQuery,
      videoSearchUrl,
      formCues: [
        `Lock out joints fully at completion where applicable.`,
        `Keep shoulders depressed and controlled.`,
        `Maintain total body tension from head to toes.`
      ],
      musclesTargeted: muscles,
      xpReward: raw.level * 150,
      proStatus: raw.level >= 15
    };
  });
})();
