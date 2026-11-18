import { RawExercise } from '@aura/types';

/**
 * The calisthenics & gym skill tree: every exercise and lift with its level (1-20), the
 * branch it climbs in (`subCategory`), its lane, and what it requires.
 *
 * Rebuilt from a coach-and-gymnast review of the original progression chart:
 * each branch starts from the easiest regression and grows out of another
 * skill, every prerequisite is a lower level, and copies were merged. Merged
 * ids are listed in exerciseAliases.ts so saved progress follows them.
 */
export const rawExercises: RawExercise[] = [
  {
    "id": "ex_437",
    "name": "Knee Push-up",
    "level": 1,
    "category": "Push-ups & Dips",
    "subCategory": "Push-ups",
    "swimlane": "Push",
    "prerequisites": [],
    "steps": [
      "From the knees with hips extended and a straight line from knees to head, lower the chest to the floor and press to locked arms; 3×15."
    ],
    "standard": "3×15"
  },
  {
    "id": "ex_7",
    "name": "Push-up",
    "level": 2,
    "category": "Push-ups & Dips",
    "subCategory": "Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_437"
    ],
    "steps": [
      "Place hands shoulder-width apart, body in a rigid plank.",
      "Lower chest until it hovers above the floor.",
      "Press back up to full arm extension."
    ],
    "standard": "3×10",
    "expertTip": "Tuck elbows at 45-degree angle.",
    "videoSearchUrl": "https://www.youtube.com/watch?v=mECzqUIDWfU"
  },
  {
    "id": "ex_26",
    "name": "Diamond Push-up",
    "level": 3,
    "category": "Push-ups & Dips",
    "subCategory": "Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_7"
    ]
  },
  {
    "id": "ex_431",
    "name": "Archer Push-up",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_26"
    ],
    "youtubeQuery": "Archer Push Up tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/dyDBGkJWgZE?list=PLBF8536CA2AB746EC&t=19"
  },
  {
    "id": "ex_108",
    "name": "Incline One-Arm Push-up",
    "level": 5,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_431"
    ]
  },
  {
    "id": "ex_146",
    "name": "Straddle One-Arm Push-up",
    "level": 7,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_108"
    ],
    "youtubeQuery": "Straddle OA PU tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/75LWvxsorKI?t=180"
  },
  {
    "id": "ex_180",
    "name": "Rings Straddle One-Arm Push-up",
    "level": 8,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_146"
    ]
  },
  {
    "id": "ex_215",
    "name": "Straight-Body One-Arm Push-up",
    "level": 9,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_180"
    ]
  },
  {
    "id": "ex_246",
    "name": "Rings Straight-Body One-Arm Push-up",
    "level": 10,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Push-up",
    "swimlane": "Push",
    "prerequisites": [
      "ex_215"
    ]
  },
  {
    "id": "ex_49",
    "name": "Rings Wide Push-up",
    "level": 3,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_7"
    ],
    "youtubeQuery": "Rings Wide Push-up tutorial bodyweight fitness"
  },
  {
    "id": "ex_75",
    "name": "Rings Push-up",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_49"
    ]
  },
  {
    "id": "ex_107",
    "name": "Rings Turned-Out Push-up",
    "level": 6,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_75",
      "ex_28"
    ]
  },
  {
    "id": "ex_145",
    "name": "Rings Turned-Out Archer Push-up",
    "level": 7,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_107"
    ]
  },
  {
    "id": "ex_430",
    "name": "Pseudo Planche Push-up",
    "level": 5,
    "category": "Push-ups & Dips",
    "subCategory": "Pseudo Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_26",
      "ex_48"
    ],
    "youtubeQuery": "PP Push Up tutorial bodyweight fitness",
    "videoSearchUrl": "http://www.youtube.com/watch?v=Cdmg0CfMZeo"
  },
  {
    "id": "ex_179",
    "name": "Rings Turned-Out 40° Pseudo Planche Push-up",
    "level": 10,
    "category": "Push-ups & Dips",
    "subCategory": "Pseudo Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_430",
      "ex_107"
    ]
  },
  {
    "id": "ex_214",
    "name": "Rings Turned-Out 60° Pseudo Planche Push-up",
    "level": 11,
    "category": "Push-ups & Dips",
    "subCategory": "Pseudo Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_179"
    ]
  },
  {
    "id": "ex_275",
    "name": "Wall Pseudo Planche Push-up",
    "level": 13,
    "category": "Push-ups & Dips",
    "subCategory": "Pseudo Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_214"
    ]
  },
  {
    "id": "ex_300",
    "name": "Rings Wall Pseudo Planche Push-up",
    "level": 14,
    "category": "Push-ups & Dips",
    "subCategory": "Pseudo Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_275"
    ]
  },
  {
    "id": "ex_245",
    "name": "Rings Turned-Out Maltese Push-up",
    "level": 12,
    "category": "Push-ups & Dips",
    "subCategory": "Maltese Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_214"
    ]
  },
  {
    "id": "ex_317",
    "name": "Wall Maltese Push-up",
    "level": 15,
    "category": "Push-ups & Dips",
    "subCategory": "Maltese Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_245",
      "ex_275"
    ],
    "youtubeQuery": "Ring Wall Maltese PU tutorial bodyweight fitness"
  },
  {
    "id": "ex_325",
    "name": "Rings Wall Maltese Push-up",
    "level": 16,
    "category": "Push-ups & Dips",
    "subCategory": "Maltese Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_317"
    ]
  },
  {
    "id": "ex_354",
    "name": "Maltese",
    "level": 18,
    "category": "Push-ups & Dips",
    "subCategory": "Maltese Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_325",
      "ex_299"
    ]
  },
  {
    "id": "ex_27",
    "name": "Parallel Bar Dip Negative",
    "level": 2,
    "category": "Push-ups & Dips",
    "subCategory": "Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_437"
    ]
  },
  {
    "id": "ex_50",
    "name": "Parallel Bar Dip",
    "level": 3,
    "category": "Push-ups & Dips",
    "subCategory": "Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_27"
    ]
  },
  {
    "id": "ex_385",
    "name": "Straight-Bar Dip",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_50"
    ],
    "youtubeQuery": "Straight Bar Dip tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/w6uo90PAIfI?t=84"
  },
  {
    "id": "ex_76",
    "name": "L-Dip",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_50"
    ]
  },
  {
    "id": "ex_109",
    "name": "45° Lean Dip",
    "level": 6,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_76"
    ]
  },
  {
    "id": "ex_147",
    "name": "Wall Bent-Body One-Arm Dip",
    "level": 7,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_109"
    ]
  },
  {
    "id": "ex_181",
    "name": "Side Bent-Body One-Arm Dip",
    "level": 8,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_147"
    ]
  },
  {
    "id": "ex_216",
    "name": "Wall Straight-Body One-Arm Dip",
    "level": 9,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_181"
    ]
  },
  {
    "id": "ex_247",
    "name": "Side Straight-Body One-Arm Dip",
    "level": 10,
    "category": "Push-ups & Dips",
    "subCategory": "One-Arm Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_216"
    ]
  },
  {
    "id": "ex_8",
    "name": "Parallel Bar Jump Dip",
    "level": 2,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_437"
    ],
    "steps": [
      "Jump up on parallel bars to support position.",
      "Lower down until elbows bend to 90 degrees.",
      "Press back up to straight arms."
    ],
    "expertTip": "Keep shoulders depressed away from ears.",
    "youtubeQuery": "Dip tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=2z8JmcrW-As"
  },
  {
    "id": "ex_52",
    "name": "Weighted Dip +10 kg",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_8",
      "ex_50"
    ]
  },
  {
    "id": "ex_78",
    "name": "1.2x Bodyweight Dip",
    "level": 5,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_52"
    ]
  },
  {
    "id": "ex_111",
    "name": "1.38x Bodyweight Dip",
    "level": 6,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_78"
    ]
  },
  {
    "id": "ex_149",
    "name": "1.55x Bodyweight Dip",
    "level": 7,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_111"
    ]
  },
  {
    "id": "ex_183",
    "name": "1.7x Bodyweight Dip",
    "level": 8,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_149"
    ]
  },
  {
    "id": "ex_218",
    "name": "1.85x Bodyweight Dip",
    "level": 9,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_183"
    ]
  },
  {
    "id": "ex_249",
    "name": "2x Bodyweight Dip",
    "level": 10,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_218"
    ]
  },
  {
    "id": "ex_277",
    "name": "2.13x Bodyweight Dip",
    "level": 12,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_249"
    ]
  },
  {
    "id": "ex_302",
    "name": "2.25x Bodyweight Dip",
    "level": 13,
    "category": "Push-ups & Dips",
    "subCategory": "Assisted & Weighted Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_277"
    ]
  },
  {
    "id": "ex_89",
    "name": "Impossible Dip (Shoulders in Front of Wrists)",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "Impossible Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_50"
    ]
  },
  {
    "id": "ex_197",
    "name": "Impossible Dip (Shoulders Behind Wrists)",
    "level": 8,
    "category": "Push-ups & Dips",
    "subCategory": "Impossible Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_89"
    ]
  },
  {
    "id": "ex_230",
    "name": "Impossible Dip (Shoulders over Elbows)",
    "level": 9,
    "category": "Push-ups & Dips",
    "subCategory": "Impossible Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_197"
    ]
  },
  {
    "id": "ex_287",
    "name": "Impossible Dip (Shoulders Behind Elbows)",
    "level": 12,
    "category": "Push-ups & Dips",
    "subCategory": "Impossible Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_230"
    ]
  },
  {
    "id": "ex_349",
    "name": "Kowalik Dip",
    "level": 16,
    "category": "Push-ups & Dips",
    "subCategory": "Impossible Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_287"
    ]
  },
  {
    "id": "ex_9",
    "name": "Rings Support Hold",
    "level": 1,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [],
    "steps": [
      "Hold bodyweight on gymnastic rings with straight arms.",
      "Keep the palms facing in and the rings still."
    ],
    "standard": "30 s hold",
    "expertTip": "Pin rings close to hips."
  },
  {
    "id": "ex_28",
    "name": "Rings Turned-Out Support Hold",
    "level": 2,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_9"
    ],
    "standard": "30 s hold"
  },
  {
    "id": "ex_51",
    "name": "Rings Dip Negative",
    "level": 3,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_28"
    ]
  },
  {
    "id": "ex_77",
    "name": "Rings Dip",
    "level": 4,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_51",
      "ex_50"
    ]
  },
  {
    "id": "ex_110",
    "name": "Rings L-Dip",
    "level": 6,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_77"
    ]
  },
  {
    "id": "ex_148",
    "name": "Rings Wide Dip",
    "level": 7,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_110"
    ]
  },
  {
    "id": "ex_182",
    "name": "Rings Turned-Out 45° Dip",
    "level": 8,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_148"
    ]
  },
  {
    "id": "ex_217",
    "name": "Rings Turned-Out 75° Dip",
    "level": 9,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_182"
    ]
  },
  {
    "id": "ex_248",
    "name": "Rings Turned-Out 90° Dip",
    "level": 10,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_217"
    ]
  },
  {
    "id": "ex_276",
    "name": "Rings Turned-Out 90°+30° Dip",
    "level": 12,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_248"
    ]
  },
  {
    "id": "ex_301",
    "name": "Rings Turned-Out 90°+50° Dip",
    "level": 13,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_276"
    ]
  },
  {
    "id": "ex_318",
    "name": "Rings Turned-Out 90°+65° Dip",
    "level": 14,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_301"
    ]
  },
  {
    "id": "ex_326",
    "name": "Rings Turned-Out 90°+75° Dip",
    "level": 15,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_318"
    ]
  },
  {
    "id": "ex_336",
    "name": "Rings Turned-Out 90°+82° Dip",
    "level": 16,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_326"
    ]
  },
  {
    "id": "ex_353",
    "name": "Rings Turned-Out 90°+88° Dip",
    "level": 17,
    "category": "Push-ups & Dips",
    "subCategory": "Rings Turned-Out Dips",
    "swimlane": "Push",
    "prerequisites": [
      "ex_336"
    ]
  },
  {
    "id": "ex_419",
    "name": "Wall Plank",
    "level": 1,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [],
    "standard": "30 s",
    "youtubeQuery": "Wall Plank tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/6jm4R3K4sJA?t=34"
  },
  {
    "id": "ex_420",
    "name": "Wall Headstand",
    "level": 2,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_419"
    ],
    "standard": "30 s",
    "youtubeQuery": "Wall Headstand tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/igdSYEx6Ydo?t=8"
  },
  {
    "id": "ex_39",
    "name": "Chest-to-Wall Handstand",
    "level": 3,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_420",
      "ex_1"
    ],
    "steps": [
      "Hands shoulder-width, fingers spread, walk the feet up the wall until the chest faces it; lock the arms, squeeze abs and glutes into one straight line and hold 30 s."
    ],
    "standard": "30 s, straight line"
  },
  {
    "id": "ex_17",
    "name": "Wall Handstand Toe Pulls",
    "level": 4,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_39"
    ],
    "standard": "5 x 5 s balancing off the wall"
  },
  {
    "id": "ex_62",
    "name": "Freestanding Handstand 10 s",
    "level": 5,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_17"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_90",
    "name": "Freestanding Handstand 30 s",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_62"
    ],
    "standard": "30 s"
  },
  {
    "id": "ex_414",
    "name": "Tuck Handstand",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "One-Arm Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_90"
    ],
    "standard": "10 s",
    "youtubeQuery": "Tuck Handstand tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/VtipeT7CMK0?t=154"
  },
  {
    "id": "ex_127",
    "name": "One-Arm Handstand Prep",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "One-Arm Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_414"
    ],
    "youtubeQuery": "Handstand tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=N3K9SMNKL7Y"
  },
  {
    "id": "ex_416",
    "name": "Straddle One-Arm Handstand",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "One-Arm Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_127"
    ],
    "standard": "5 s each arm",
    "youtubeQuery": "Straddle OA HS tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=l2yCzIknXxg"
  },
  {
    "id": "ex_259",
    "name": "One-Arm Handstand",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "One-Arm Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_416"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_388",
    "name": "One-Arm Elbow Lever Press to One-Arm Handstand",
    "level": 16,
    "category": "Handstands & Planche",
    "subCategory": "One-Arm Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_259",
      "ex_220"
    ],
    "youtubeQuery": "OA Elbow Lever Press to OA HS tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/Ly1SSSyns-s?t=144"
  },
  {
    "id": "ex_1",
    "name": "Pike Push-up",
    "level": 2,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_437"
    ],
    "steps": [
      "Place your hands on the floor or a sturdy surface slightly wider than shoulder-width.",
      "Step your feet back so your body forms a piked V shape.",
      "Bend your elbows to slowly lower your head forward toward the floor.",
      "Push strongly through your palms to straighten your arms."
    ],
    "standard": "3x10",
    "expertTip": "Keep your elbows pointing diagonally backward (like an arrow), not flared out.",
    "videoSearchUrl": "https://www.youtube.com/watch?v=lfkdSEg5tZQ"
  },
  {
    "id": "ex_428",
    "name": "Decline Pike Push-up",
    "level": 3,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_1"
    ],
    "standard": "3x8",
    "youtubeQuery": "Decline Pike PU tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=ZnsLpLhywgk&feature=youtu.be&t=50"
  },
  {
    "id": "ex_18",
    "name": "Box Pike Push-up",
    "level": 4,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_428"
    ],
    "standard": "3x6, hips over hands, head to floor"
  },
  {
    "id": "ex_40",
    "name": "Wall Headstand Push-up Negative",
    "level": 5,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_18",
      "ex_39"
    ],
    "standard": "3x3, 5 s lowering to the head"
  },
  {
    "id": "ex_63",
    "name": "Wall Headstand Push-up",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_40"
    ],
    "standard": "3x5, head to floor"
  },
  {
    "id": "ex_92",
    "name": "Wall Handstand Push-up",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_63"
    ],
    "standard": "3x5, full range on parallettes"
  },
  {
    "id": "ex_129",
    "name": "Freestanding Headstand Push-up",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_92",
      "ex_90"
    ],
    "standard": "3 reps, head to floor"
  },
  {
    "id": "ex_165",
    "name": "Freestanding Handstand Push-up",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_129"
    ],
    "standard": "3 reps, full range"
  },
  {
    "id": "ex_91",
    "name": "Rings Shoulder Stand",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_77",
      "ex_39"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_128",
    "name": "Rings Strap Handstand",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_91"
    ],
    "standard": "30 s"
  },
  {
    "id": "ex_164",
    "name": "Rings Handstand",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_128",
      "ex_90"
    ],
    "standard": "10 s off the straps"
  },
  {
    "id": "ex_166",
    "name": "Rings Wide Handstand Push-up",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_128",
      "ex_92"
    ]
  },
  {
    "id": "ex_198",
    "name": "Rings Strap Handstand Push-up",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_166"
    ]
  },
  {
    "id": "ex_231",
    "name": "Rings Freestanding Handstand Push-up",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Rings Handstand Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_198",
      "ex_164"
    ]
  },
  {
    "id": "ex_48",
    "name": "Frog Stand",
    "level": 3,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_7"
    ],
    "standard": "30 s"
  },
  {
    "id": "ex_438",
    "name": "Planche Lean",
    "level": 4,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_48"
    ],
    "steps": [
      "Push-up position on straight arms, protract and lean until the shoulders are well past the hands; hold 20 s."
    ],
    "standard": "20 s"
  },
  {
    "id": "ex_73",
    "name": "Straight-Arm Frog Stand",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_438"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_105",
    "name": "Tuck Planche",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_73"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_142",
    "name": "Advanced Tuck Planche",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_105"
    ],
    "standard": "10 s"
  },
  {
    "id": "ex_210",
    "name": "Straddle Planche",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_142"
    ],
    "standard": "5 s"
  },
  {
    "id": "ex_244",
    "name": "Half Lay Planche",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_210"
    ],
    "standard": "5 s"
  },
  {
    "id": "ex_299",
    "name": "Full Planche",
    "level": 14,
    "category": "Handstands & Planche",
    "subCategory": "Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_244"
    ],
    "standard": "5 s"
  },
  {
    "id": "ex_144",
    "name": "Tuck Planche Push-up",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_105"
    ],
    "standard": "3x5"
  },
  {
    "id": "ex_212",
    "name": "Advanced Tuck Planche Push-up",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_144",
      "ex_142"
    ]
  },
  {
    "id": "ex_273",
    "name": "Straddle Planche Push-up",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_212",
      "ex_210"
    ]
  },
  {
    "id": "ex_315",
    "name": "Half Lay Planche Push-up",
    "level": 15,
    "category": "Handstands & Planche",
    "subCategory": "Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_273",
      "ex_244"
    ]
  },
  {
    "id": "ex_334",
    "name": "Full Planche Push-up",
    "level": 16,
    "category": "Handstands & Planche",
    "subCategory": "Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_315",
      "ex_299"
    ]
  },
  {
    "id": "ex_74",
    "name": "Rings Frog Stand",
    "level": 5,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_48",
      "ex_9"
    ]
  },
  {
    "id": "ex_106",
    "name": "Rings Straight-Arm Frog Stand",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_74",
      "ex_73"
    ]
  },
  {
    "id": "ex_143",
    "name": "Rings Tuck Planche",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_106",
      "ex_105"
    ]
  },
  {
    "id": "ex_211",
    "name": "Rings Advanced Tuck Planche",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_143",
      "ex_142"
    ]
  },
  {
    "id": "ex_272",
    "name": "Rings Straddle Planche",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_211",
      "ex_210"
    ]
  },
  {
    "id": "ex_314",
    "name": "Rings Half Lay Planche",
    "level": 15,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_272",
      "ex_244"
    ]
  },
  {
    "id": "ex_333",
    "name": "Rings Full Planche",
    "level": 16,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_314",
      "ex_299"
    ]
  },
  {
    "id": "ex_213",
    "name": "Rings Tuck Planche Push-up",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_143",
      "ex_144"
    ]
  },
  {
    "id": "ex_274",
    "name": "Rings Advanced Tuck Planche Push-up",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_213",
      "ex_211"
    ]
  },
  {
    "id": "ex_316",
    "name": "Rings Straddle Planche Push-up",
    "level": 15,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_274",
      "ex_272"
    ]
  },
  {
    "id": "ex_335",
    "name": "Rings Half Lay Planche Push-up",
    "level": 16,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_316",
      "ex_314"
    ]
  },
  {
    "id": "ex_352",
    "name": "Rings Full Planche Push-up",
    "level": 18,
    "category": "Handstands & Planche",
    "subCategory": "Rings Planche Push-ups",
    "swimlane": "Push",
    "prerequisites": [
      "ex_335",
      "ex_333"
    ]
  },
  {
    "id": "ex_313",
    "name": "Straight-Arm Straddle Planche to Handstand",
    "level": 15,
    "category": "Handstands & Planche",
    "subCategory": "Planche to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_210",
      "ex_202"
    ]
  },
  {
    "id": "ex_332",
    "name": "Rings Straight-Arm Straddle Planche to Handstand",
    "level": 16,
    "category": "Handstands & Planche",
    "subCategory": "Planche to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_313",
      "ex_272"
    ]
  },
  {
    "id": "ex_351",
    "name": "Rings Straight-Arm Full Planche to Handstand",
    "level": 18,
    "category": "Handstands & Planche",
    "subCategory": "Planche to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_332",
      "ex_333"
    ]
  },
  {
    "id": "ex_113",
    "name": "Two-Arm Elbow Lever",
    "level": 5,
    "category": "Handstands & Planche",
    "subCategory": "Elbow Lever",
    "swimlane": "Push",
    "prerequisites": [
      "ex_48"
    ]
  },
  {
    "id": "ex_151",
    "name": "Rings Two-Arm Elbow Lever",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Elbow Lever",
    "swimlane": "Push",
    "prerequisites": [
      "ex_113",
      "ex_9"
    ]
  },
  {
    "id": "ex_185",
    "name": "One-Arm Straddle Elbow Lever",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Elbow Lever",
    "swimlane": "Push",
    "prerequisites": [
      "ex_151"
    ]
  },
  {
    "id": "ex_220",
    "name": "One-Arm Straight-Body Elbow Lever",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Elbow Lever",
    "swimlane": "Push",
    "prerequisites": [
      "ex_185"
    ]
  },
  {
    "id": "ex_94",
    "name": "Bent-Arm Bent-Body Press",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_90",
      "ex_63"
    ]
  },
  {
    "id": "ex_131",
    "name": "L-Sit Bent-Arm Bent-Body Press",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_94",
      "ex_42"
    ]
  },
  {
    "id": "ex_168",
    "name": "Chest Roll Straight-Body Press",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_131"
    ]
  },
  {
    "id": "ex_200",
    "name": "Bent-Arm Straight-Body Press",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_168"
    ]
  },
  {
    "id": "ex_233",
    "name": "Handstand to Elbow Lever to Handstand",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_200",
      "ex_113"
    ]
  },
  {
    "id": "ex_261",
    "name": "Parallel Bar Straight-Body Dip to Handstand",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Bent-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_233"
    ]
  },
  {
    "id": "ex_132",
    "name": "Chair Press to Handstand",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_94"
    ]
  },
  {
    "id": "ex_169",
    "name": "Chair Illusion Press",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_132"
    ]
  },
  {
    "id": "ex_201",
    "name": "Rings Bent-Arm Bent-Body Press",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_169",
      "ex_164"
    ]
  },
  {
    "id": "ex_234",
    "name": "Rings Dip to Handstand",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_201"
    ]
  },
  {
    "id": "ex_262",
    "name": "Rings Bent-Arm Straight-Body Press",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_234",
      "ex_200"
    ]
  },
  {
    "id": "ex_289",
    "name": "Rings Handstand to Elbow Lever to Handstand",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_262",
      "ex_151"
    ]
  },
  {
    "id": "ex_310",
    "name": "Rings Straight-Body Dip to Handstand",
    "level": 14,
    "category": "Handstands & Planche",
    "subCategory": "Rings Bent-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_289",
      "ex_261"
    ]
  },
  {
    "id": "ex_95",
    "name": "Wall Straddle Press Negative",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Straight-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_90"
    ]
  },
  {
    "id": "ex_133",
    "name": "Elevated Straddle Press",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Straight-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_95"
    ]
  },
  {
    "id": "ex_170",
    "name": "Standing Straddle Press",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Straight-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_133"
    ]
  },
  {
    "id": "ex_202",
    "name": "Straddle-L Straddle Press",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Straight-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_170",
      "ex_65"
    ]
  },
  {
    "id": "ex_235",
    "name": "L-Sit Pike Press",
    "level": 11,
    "category": "Handstands & Planche",
    "subCategory": "Straight-Arm Press to Handstand",
    "swimlane": "Push",
    "prerequisites": [
      "ex_202"
    ]
  },
  {
    "id": "ex_263",
    "name": "Rings Straight-Arm L-Sit Straddle Press",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Rings Straight-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_202",
      "ex_164"
    ]
  },
  {
    "id": "ex_290",
    "name": "Rings Straight-Arm Straddle-L Press",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Rings Straight-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_263"
    ]
  },
  {
    "id": "ex_311",
    "name": "Rings Straight-Arm Pike Press",
    "level": 14,
    "category": "Handstands & Planche",
    "subCategory": "Rings Straight-Arm Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_290",
      "ex_235"
    ]
  },
  {
    "id": "ex_19",
    "name": "0.3x Bodyweight Overhead Press",
    "level": 3,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_1"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_41",
    "name": "0.43x Bodyweight Overhead Press",
    "level": 4,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_19"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_64",
    "name": "0.55x Bodyweight Overhead Press",
    "level": 5,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_41"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_93",
    "name": "0.68x Bodyweight Overhead Press",
    "level": 6,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_64"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_130",
    "name": "0.8x Bodyweight Overhead Press",
    "level": 7,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_93"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_167",
    "name": "0.9x Bodyweight Overhead Press",
    "level": 8,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_130"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_199",
    "name": "1x Bodyweight Overhead Press",
    "level": 9,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_167"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_232",
    "name": "1.08x Bodyweight Overhead Press",
    "level": 10,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_199"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_260",
    "name": "1.15x Bodyweight Overhead Press",
    "level": 12,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_232"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_288",
    "name": "1.2x Bodyweight Overhead Press",
    "level": 13,
    "category": "Handstands & Planche",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_260"
    ],
    "standard": "1 strict rep"
  },
  {
    "id": "ex_439",
    "name": "Dead Hang",
    "level": 1,
    "category": "Pulling",
    "subCategory": "Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [],
    "steps": [
      "Hang from a bar with straight arms and a full grip, feet off the floor, shoulders relaxed; build to 30 s."
    ],
    "standard": "30 s hold"
  },
  {
    "id": "ex_23",
    "name": "Pull-up Negative",
    "level": 2,
    "category": "Pulling",
    "subCategory": "Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ],
    "standard": "3x5, 5 s down"
  },
  {
    "id": "ex_45",
    "name": "Pull-up",
    "level": 3,
    "category": "Pulling",
    "subCategory": "Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_23",
      "ex_380"
    ],
    "standard": "3x5"
  },
  {
    "id": "ex_69",
    "name": "L-Sit Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45",
      "ex_367"
    ]
  },
  {
    "id": "ex_101",
    "name": "Bar Pullover",
    "level": 5,
    "category": "Pulling",
    "subCategory": "Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_69"
    ],
    "youtubeQuery": "Pullover tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/eTq8oqjm2Wc?list=PLOj76wV2WfPvMTkUMXbu6gV62XSsdnMRh&t=48"
  },
  {
    "id": "ex_380",
    "name": "Scapular Pull-up",
    "level": 2,
    "category": "Pulling",
    "subCategory": "Scapula & Chest-to-Bar",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ],
    "standard": "3x10",
    "youtubeQuery": "Scapular Pull tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/FgYoc4O-cio?t=1m21s"
  },
  {
    "id": "ex_383",
    "name": "Arch Hang",
    "level": 3,
    "category": "Pulling",
    "subCategory": "Scapula & Chest-to-Bar",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_380"
    ],
    "standard": "3x20 s",
    "youtubeQuery": "Arch Hang tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/C995b3KLXS4?t=7s"
  },
  {
    "id": "ex_384",
    "name": "Chest-to-Bar Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Scapula & Chest-to-Bar",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_383",
      "ex_45"
    ],
    "youtubeQuery": "C2B Pull Up tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=PmdNNN8nLGI"
  },
  {
    "id": "ex_372",
    "name": "Tuck Ice Cream Maker",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Scapula & Chest-to-Bar",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_384",
      "ex_67"
    ],
    "youtubeQuery": "Tuck ICM tutorial bodyweight fitness"
  },
  {
    "id": "ex_368",
    "name": "Vertical Row",
    "level": 1,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [],
    "standard": "3x12",
    "youtubeQuery": "Vertical Row tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/rloXYB8M3vU"
  },
  {
    "id": "ex_22",
    "name": "Ring Row",
    "level": 2,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_368"
    ],
    "standard": "3x10"
  },
  {
    "id": "ex_44",
    "name": "Wide Row",
    "level": 3,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_22"
    ],
    "youtubeQuery": "Wide Row tutorial bodyweight fitness",
    "videoSearchUrl": "http://www.youtube.com/watch?v=1yMRvsuk9Xg"
  },
  {
    "id": "ex_68",
    "name": "Archer Row",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_44"
    ],
    "youtubeQuery": "Archer Row tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=067f1CA6OvE"
  },
  {
    "id": "ex_100",
    "name": "Archer-In Row",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_68"
    ]
  },
  {
    "id": "ex_138",
    "name": "Straddle One-Arm Row",
    "level": 7,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_100"
    ],
    "youtubeQuery": "Str OA Row tutorial bodyweight fitness"
  },
  {
    "id": "ex_175",
    "name": "One-Arm Row",
    "level": 8,
    "category": "Pulling",
    "subCategory": "Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_138"
    ]
  },
  {
    "id": "ex_24",
    "name": "Assisted Pull-up (Band or Machine)",
    "level": 2,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ],
    "steps": [
      "Loop a band over the bar and stand in it, or kneel on the pad of the assisted pull-up machine.",
      "Pull up until your chin clears the bar.",
      "Lower all the way to straight arms under control."
    ],
    "standard": "3×8, chin over the bar.",
    "expertTip": "Take a little less help each week: a thinner band, or less counterweight on the machine."
  },
  {
    "id": "ex_71",
    "name": "1.18x Bodyweight Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_24",
      "ex_45"
    ]
  },
  {
    "id": "ex_103",
    "name": "1.35x Bodyweight Pull-up",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_71"
    ]
  },
  {
    "id": "ex_140",
    "name": "1.5x Bodyweight Pull-up",
    "level": 7,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_103"
    ]
  },
  {
    "id": "ex_177",
    "name": "1.65x Bodyweight Pull-up",
    "level": 8,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_140"
    ]
  },
  {
    "id": "ex_208",
    "name": "1.78x Bodyweight Pull-up",
    "level": 9,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_177"
    ]
  },
  {
    "id": "ex_241",
    "name": "1.9x Bodyweight Pull-up",
    "level": 10,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_208"
    ]
  },
  {
    "id": "ex_269",
    "name": "2x Bodyweight Pull-up",
    "level": 12,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_241"
    ]
  },
  {
    "id": "ex_296",
    "name": "2.1x Bodyweight Pull-up",
    "level": 13,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_269"
    ]
  },
  {
    "id": "ex_47",
    "name": "Explosive Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45"
    ]
  },
  {
    "id": "ex_104",
    "name": "Strict Clapping Pull-up",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_47"
    ]
  },
  {
    "id": "ex_141",
    "name": "L-Sit Clapping Pull-up",
    "level": 7,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_104",
      "ex_69"
    ]
  },
  {
    "id": "ex_209",
    "name": "L-Sit Ab-Slap Pull-up",
    "level": 9,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_141"
    ]
  },
  {
    "id": "ex_242",
    "name": "L-Sit Thigh-Slap Pull-up",
    "level": 10,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_209"
    ]
  },
  {
    "id": "ex_270",
    "name": "Thigh-Slap Pull-up",
    "level": 12,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_242"
    ]
  },
  {
    "id": "ex_297",
    "name": "Strict Behind-the-Back Clap Pull-up",
    "level": 13,
    "category": "Pulling",
    "subCategory": "Explosive Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_270",
      "ex_178"
    ]
  },
  {
    "id": "ex_25",
    "name": "Kipping Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Kipping Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45",
      "ex_441"
    ]
  },
  {
    "id": "ex_72",
    "name": "Kipping Clapping Pull-up",
    "level": 5,
    "category": "Pulling",
    "subCategory": "Kipping Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_25"
    ]
  },
  {
    "id": "ex_178",
    "name": "Kipping Behind-the-Back Clap Pull-up",
    "level": 8,
    "category": "Pulling",
    "subCategory": "Kipping Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_72"
    ]
  },
  {
    "id": "ex_366",
    "name": "360° Pull-up",
    "level": 9,
    "category": "Pulling",
    "subCategory": "Kipping Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_178"
    ],
    "standard": "1 clean rep, regrab both hands",
    "youtubeQuery": "360° Pull tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=1k-FRtD2Wq8"
  },
  {
    "id": "ex_376",
    "name": "Typewriter Pull-up",
    "level": 5,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45"
    ],
    "youtubeQuery": "Typewriter Pull Up tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/vdjWgw98EeI?t=92"
  },
  {
    "id": "ex_377",
    "name": "Archer Pull-up",
    "level": 6,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_376"
    ],
    "youtubeQuery": "Archer Pull Up tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/vdjWgw98EeI?t=1m52s"
  },
  {
    "id": "ex_207",
    "name": "One-Arm Chin-up Negative",
    "level": 8,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_377"
    ]
  },
  {
    "id": "ex_240",
    "name": "One-Arm Chin-up",
    "level": 10,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_207"
    ]
  },
  {
    "id": "ex_268",
    "name": "One-Arm Chin-up + 15 lbs",
    "level": 13,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_240"
    ]
  },
  {
    "id": "ex_295",
    "name": "One-Arm Chin-up + 25 lbs",
    "level": 14,
    "category": "Pulling",
    "subCategory": "One-Arm Chin-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_268"
    ]
  },
  {
    "id": "ex_378",
    "name": "One-Arm Pull-up Negative",
    "level": 9,
    "category": "Pulling",
    "subCategory": "One-Arm Pull-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_207"
    ],
    "youtubeQuery": "OA Pull Up Neg tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=QhJzZAJjcXg"
  },
  {
    "id": "ex_379",
    "name": "One-Arm Pull-up",
    "level": 11,
    "category": "Pulling",
    "subCategory": "One-Arm Pull-up",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_378",
      "ex_240"
    ],
    "youtubeQuery": "High One Arm Pull Up tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=OAZ63ZqZ4_E"
  },
  {
    "id": "ex_70",
    "name": "Rings L-Sit Pull-up",
    "level": 4,
    "category": "Pulling",
    "subCategory": "Rings Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45",
      "ex_367"
    ]
  },
  {
    "id": "ex_102",
    "name": "Rings Wide Pull-up",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Rings Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_70"
    ]
  },
  {
    "id": "ex_139",
    "name": "Rings Wide L-Sit Pull-up",
    "level": 7,
    "category": "Pulling",
    "subCategory": "Rings Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_102"
    ]
  },
  {
    "id": "ex_176",
    "name": "Rings Archer Pull-up",
    "level": 8,
    "category": "Pulling",
    "subCategory": "Rings Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_139",
      "ex_377"
    ]
  },
  {
    "id": "ex_440",
    "name": "Ring Bicep Curl",
    "level": 3,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_22"
    ],
    "steps": [
      "Lean back holding rings palms up, body straight, and curl until the hands reach the forehead with elbows held high; 3x10 at about 45 degrees."
    ],
    "standard": "3x10"
  },
  {
    "id": "ex_125",
    "name": "Incline Pelican Curl",
    "level": 6,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_440",
      "ex_3"
    ]
  },
  {
    "id": "ex_162",
    "name": "Pelican Curl",
    "level": 7,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_125"
    ]
  },
  {
    "id": "ex_195",
    "name": "Feet-Elevated Pelican Curl",
    "level": 8,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_162"
    ]
  },
  {
    "id": "ex_227",
    "name": "Hefesto Negative",
    "level": 9,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_195"
    ]
  },
  {
    "id": "ex_256",
    "name": "Hefesto",
    "level": 10,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_227"
    ]
  },
  {
    "id": "ex_284",
    "name": "Back Lever Hefesto",
    "level": 12,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_256",
      "ex_172"
    ]
  },
  {
    "id": "ex_307",
    "name": "Archer Hefesto",
    "level": 13,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_284"
    ]
  },
  {
    "id": "ex_321",
    "name": "Hand-on-Wrist Hefesto",
    "level": 14,
    "category": "Pulling",
    "subCategory": "Bodyweight Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_307"
    ]
  },
  {
    "id": "ex_3",
    "name": "German Hang",
    "level": 2,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ],
    "steps": [
      "Grab pull-up bar or rings with both hands.",
      "Pass your feet through your arms into an inverted hang.",
      "Lower your feet toward the floor behind you into a deep shoulder extension stretch."
    ],
    "standard": "30 s hold",
    "expertTip": "Keep your core engaged and arms straight throughout the stretch.",
    "youtubeQuery": "German Hang Pullout tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=5KaDOUeMY98"
  },
  {
    "id": "ex_21",
    "name": "Skin the Cat",
    "level": 3,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_3"
    ],
    "standard": "5 slow reps",
    "youtubeQuery": "Pike Skin the Cat tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=ImOhdGiaQqY&feature=youtu.be"
  },
  {
    "id": "ex_43",
    "name": "Tuck Back Lever",
    "level": 4,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_21"
    ],
    "standard": "10 s hold",
    "youtubeQuery": "Adv Tuck Back Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=CqMDxeYvQeY"
  },
  {
    "id": "ex_66",
    "name": "Advanced Tuck Back Lever",
    "level": 5,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_43"
    ]
  },
  {
    "id": "ex_97",
    "name": "Straddle Back Lever",
    "level": 6,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_66"
    ],
    "youtubeQuery": "Straddle Back Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/HXaG8mJmSnU?t=215"
  },
  {
    "id": "ex_135",
    "name": "Half-Lay / One-Leg Back Lever",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_97"
    ]
  },
  {
    "id": "ex_172",
    "name": "Full Back Lever",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_135"
    ],
    "standard": "10 s hold"
  },
  {
    "id": "ex_188",
    "name": "Rings Back Lever",
    "level": 9,
    "category": "Levers & Rings",
    "subCategory": "Back Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_172"
    ],
    "youtubeQuery": "Back Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=HXaG8mJmSnU"
  },
  {
    "id": "ex_204",
    "name": "Back Lever Pullout",
    "level": 9,
    "category": "Levers & Rings",
    "subCategory": "Back Lever Pullouts",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_172"
    ],
    "youtubeQuery": "Back Lever Pullout tutorial bodyweight fitness"
  },
  {
    "id": "ex_237",
    "name": "German Hang Pullout",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Back Lever Pullouts",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_204"
    ]
  },
  {
    "id": "ex_265",
    "name": "Bent-Arm Pull-up to Back Lever",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Back Lever Pullouts",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_237"
    ]
  },
  {
    "id": "ex_292",
    "name": "Handstand Lower to Back Lever",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Back Lever Pullouts",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_265",
      "ex_164"
    ],
    "youtubeQuery": "Handstand Lower to BL tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=dJ0DzpxjZRs"
  },
  {
    "id": "ex_67",
    "name": "Tuck Front Lever",
    "level": 4,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45",
      "ex_441"
    ],
    "standard": "10 s hold",
    "youtubeQuery": "Tuck Front Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=VUe3M0iLPG0&feature=youtu.be"
  },
  {
    "id": "ex_98",
    "name": "Advanced Tuck Front Lever",
    "level": 6,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_67"
    ],
    "youtubeQuery": "Adv Tuck Front Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=NicnELGtOSE"
  },
  {
    "id": "ex_136",
    "name": "Straddle Front Lever",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_98"
    ],
    "youtubeQuery": "Straddle Front Lever tutorial bodyweight fitness"
  },
  {
    "id": "ex_173",
    "name": "One-Leg Front Lever",
    "level": 9,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_136"
    ]
  },
  {
    "id": "ex_205",
    "name": "Full Front Lever",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_173"
    ],
    "standard": "10 s hold"
  },
  {
    "id": "ex_223",
    "name": "Rings Front Lever",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Front Lever",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_205"
    ],
    "youtubeQuery": "Front Lever tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/ZqCLG0hiRco?t=8"
  },
  {
    "id": "ex_238",
    "name": "Front Lever to Inverted Hang",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Pulls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_205"
    ],
    "youtubeQuery": "FL to Inverted tutorial bodyweight fitness"
  },
  {
    "id": "ex_266",
    "name": "Hang Pull to Inverted Hang",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Pulls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_238"
    ]
  },
  {
    "id": "ex_293",
    "name": "Front Lever Circle",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Pulls",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_266"
    ]
  },
  {
    "id": "ex_99",
    "name": "Tuck Front Lever Row",
    "level": 5,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_67"
    ]
  },
  {
    "id": "ex_137",
    "name": "Advanced Tuck Front Lever Row",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_99",
      "ex_98"
    ]
  },
  {
    "id": "ex_174",
    "name": "Advanced Tuck Front Lever Rope Climb",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_137"
    ]
  },
  {
    "id": "ex_206",
    "name": "Straddle Front Lever Row",
    "level": 9,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_174",
      "ex_136"
    ]
  },
  {
    "id": "ex_239",
    "name": "Advanced Straddle Front Lever Row",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_206"
    ]
  },
  {
    "id": "ex_267",
    "name": "Full Front Lever Row",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_239",
      "ex_205"
    ]
  },
  {
    "id": "ex_294",
    "name": "Front Lever Rope Climb",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_267"
    ]
  },
  {
    "id": "ex_229",
    "name": "One-Arm Back Lever",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "One-Arm Levers",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_172"
    ]
  },
  {
    "id": "ex_322",
    "name": "One-Arm Front Lever",
    "level": 17,
    "category": "Levers & Rings",
    "subCategory": "One-Arm Levers",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_229",
      "ex_205"
    ]
  },
  {
    "id": "ex_330",
    "name": "One-Arm Dragon Press",
    "level": 18,
    "category": "Levers & Rings",
    "subCategory": "One-Arm Levers",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_322",
      "ex_285"
    ]
  },
  {
    "id": "ex_257",
    "name": "Protracted Victorian on Bars",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_205"
    ]
  },
  {
    "id": "ex_285",
    "name": "Dragon Press",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_257"
    ]
  },
  {
    "id": "ex_308",
    "name": "Victorian on Bars",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_285"
    ]
  },
  {
    "id": "ex_329",
    "name": "Wide Victorian on Bars",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_308"
    ]
  },
  {
    "id": "ex_348",
    "name": "Rings Victorian",
    "level": 18,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_329",
      "ex_223"
    ]
  },
  {
    "id": "ex_357",
    "name": "Floor Victorian on Forearms",
    "level": 19,
    "category": "Levers & Rings",
    "subCategory": "Victorian",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_348"
    ]
  },
  {
    "id": "ex_243",
    "name": "Assisted Iron Cross",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_188",
      "ex_28"
    ],
    "youtubeQuery": "Iron Cross tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=8HuF1nrZSGA"
  },
  {
    "id": "ex_271",
    "name": "Iron Cross",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_243"
    ],
    "standard": "3 s hold"
  },
  {
    "id": "ex_356",
    "name": "Inverted Cross",
    "level": 16,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_271",
      "ex_164"
    ]
  },
  {
    "id": "ex_298",
    "name": "Iron Cross to Back Lever",
    "level": 14,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross Transitions",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_271"
    ]
  },
  {
    "id": "ex_324",
    "name": "Iron Cross Pullout",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross Transitions",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_298"
    ]
  },
  {
    "id": "ex_331",
    "name": "Hang Pull to Back Lever",
    "level": 16,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross Transitions",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_324"
    ]
  },
  {
    "id": "ex_350",
    "name": "Support Hang to Cross",
    "level": 17,
    "category": "Levers & Rings",
    "subCategory": "Iron Cross Transitions",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_331"
    ]
  },
  {
    "id": "ex_53",
    "name": "Muscle-up Negative",
    "level": 4,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_45",
      "ex_50"
    ],
    "standard": "5 slow reps",
    "youtubeQuery": "MU Neg tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=WKf1PfMqfmU"
  },
  {
    "id": "ex_79",
    "name": "Kipping Muscle-up",
    "level": 5,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_53",
      "ex_47"
    ],
    "standard": "5 reps",
    "youtubeQuery": "Kipping MU tutorial bodyweight fitness",
    "videoSearchUrl": "http://www.youtube.com/watch?v=Fpk1a_PxEw4"
  },
  {
    "id": "ex_112",
    "name": "Strict Muscle-up",
    "level": 6,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_79",
      "ex_77"
    ],
    "standard": "3 reps"
  },
  {
    "id": "ex_150",
    "name": "Wide / No-False-Grip Muscle-up",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_112"
    ]
  },
  {
    "id": "ex_184",
    "name": "Strict Bar Muscle-up",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_150",
      "ex_385"
    ],
    "youtubeQuery": "Strict Bar MU tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=t8_M2aHiNDk"
  },
  {
    "id": "ex_250",
    "name": "Archer Muscle-up",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_184"
    ],
    "youtubeQuery": "Archer Muscle-up tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=ke1sbJLeshg"
  },
  {
    "id": "ex_219",
    "name": "Straddle Front Lever Muscle-up to Advanced Tuck Planche",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_184",
      "ex_136"
    ]
  },
  {
    "id": "ex_303",
    "name": "Front Lever Muscle-up to Straddle Planche",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_219",
      "ex_210"
    ]
  },
  {
    "id": "ex_345",
    "name": "Butterfly Mount Muscle-up",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_303"
    ]
  },
  {
    "id": "ex_355",
    "name": "Elevator Muscle-up",
    "level": 16,
    "category": "Levers & Rings",
    "subCategory": "Front Lever Muscle-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_345"
    ],
    "youtubeQuery": "Elevator Muscle-up tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=2FZ9t2vl1kc"
  },
  {
    "id": "ex_155",
    "name": "Kip to Support",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_9",
      "ex_21"
    ]
  },
  {
    "id": "ex_189",
    "name": "Back Kip to Support",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_155"
    ]
  },
  {
    "id": "ex_253",
    "name": "Straight-Arm Kip to L-sit",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_189",
      "ex_42"
    ]
  },
  {
    "id": "ex_281",
    "name": "Straight-Arm Back Kip to Support",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_253"
    ]
  },
  {
    "id": "ex_304",
    "name": "Back Kip to Handstand",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_281",
      "ex_164"
    ]
  },
  {
    "id": "ex_327",
    "name": "Straight-Arm Kip to Iron Cross",
    "level": 14,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_304",
      "ex_271"
    ]
  },
  {
    "id": "ex_339",
    "name": "Back Kip to Iron Cross",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_327"
    ]
  },
  {
    "id": "ex_346",
    "name": "Back Kip to Straddle Planche",
    "level": 16,
    "category": "Levers & Rings",
    "subCategory": "Rings Kips",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_339",
      "ex_272"
    ]
  },
  {
    "id": "ex_117",
    "name": "Forward Felge to Support (Tuck)",
    "level": 6,
    "category": "Levers & Rings",
    "subCategory": "Forward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_9",
      "ex_21"
    ]
  },
  {
    "id": "ex_156",
    "name": "Forward Felge to Support (Pike)",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Forward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_117"
    ]
  },
  {
    "id": "ex_282",
    "name": "Forward Felge to Support (Straight Body)",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Forward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_156"
    ]
  },
  {
    "id": "ex_328",
    "name": "Straight-Arm Felge to Iron Cross",
    "level": 14,
    "category": "Levers & Rings",
    "subCategory": "Forward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_282",
      "ex_271"
    ]
  },
  {
    "id": "ex_347",
    "name": "Straight-Arm Forward Felge to Handstand (Straight Body)",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Forward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_328",
      "ex_164"
    ]
  },
  {
    "id": "ex_190",
    "name": "Backward Felge to Support (Pike)",
    "level": 8,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_156"
    ]
  },
  {
    "id": "ex_305",
    "name": "Backward Felge to Support (Straddle)",
    "level": 11,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_190"
    ]
  },
  {
    "id": "ex_278",
    "name": "Backward Felge to Support (Straight Body)",
    "level": 12,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_305"
    ]
  },
  {
    "id": "ex_320",
    "name": "Backward Felge to Rings Handstand",
    "level": 13,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_278",
      "ex_164"
    ]
  },
  {
    "id": "ex_319",
    "name": "Backward Felge to Handstand (Straight Body)",
    "level": 14,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_320"
    ]
  },
  {
    "id": "ex_337",
    "name": "Straight-Body Rotation to Handstand",
    "level": 15,
    "category": "Levers & Rings",
    "subCategory": "Backward Felges",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_319"
    ]
  },
  {
    "id": "ex_154",
    "name": "Rings Turned-Out Straddle L-sit",
    "level": 7,
    "category": "Levers & Rings",
    "subCategory": "Rings L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_96"
    ]
  },
  {
    "id": "ex_252",
    "name": "Rings 90° V-sit",
    "level": 10,
    "category": "Levers & Rings",
    "subCategory": "Rings L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_154",
      "ex_203"
    ]
  },
  {
    "id": "ex_358",
    "name": "One-Arm Planche",
    "level": 20,
    "category": "Levers & Rings",
    "subCategory": "One-Arm Planche",
    "swimlane": "Push",
    "prerequisites": [
      "ex_299"
    ]
  },
  {
    "id": "ex_30",
    "name": "Plank",
    "level": 1,
    "category": "Core",
    "subCategory": "Plank",
    "swimlane": "Core",
    "prerequisites": [],
    "standard": "30 s hold"
  },
  {
    "id": "ex_54",
    "name": "60-Second Plank",
    "level": 2,
    "category": "Core",
    "subCategory": "Plank",
    "swimlane": "Core",
    "prerequisites": [
      "ex_30"
    ],
    "standard": "60 s hold"
  },
  {
    "id": "ex_80",
    "name": "One-Arm One-Leg Plank",
    "level": 3,
    "category": "Core",
    "subCategory": "Plank",
    "swimlane": "Core",
    "prerequisites": [
      "ex_54"
    ]
  },
  {
    "id": "ex_115",
    "name": "Kneeling Ab Wheel Rollout",
    "level": 4,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_80"
    ]
  },
  {
    "id": "ex_153",
    "name": "Ramp Ab Wheel Rollout",
    "level": 6,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_115"
    ]
  },
  {
    "id": "ex_187",
    "name": "Standing Ab Wheel Eccentric",
    "level": 7,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_153"
    ]
  },
  {
    "id": "ex_222",
    "name": "Standing Ab Wheel Rollout",
    "level": 8,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_187"
    ]
  },
  {
    "id": "ex_251",
    "name": "Standing Ab Wheel Rollout + 20 lb",
    "level": 9,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_222"
    ]
  },
  {
    "id": "ex_279",
    "name": "One-Arm Ab Wheel Rollout",
    "level": 11,
    "category": "Core",
    "subCategory": "Ab Wheel",
    "swimlane": "Core",
    "prerequisites": [
      "ex_251"
    ]
  },
  {
    "id": "ex_441",
    "name": "Hollow Body Hold",
    "level": 1,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [],
    "steps": [
      "Lie on your back, arms overhead, press the lower back into the floor and lift shoulders and straight legs a few cm; hold 30 s without the back arching."
    ],
    "standard": "30 s hold"
  },
  {
    "id": "ex_37",
    "name": "Lying Straight-Leg Raise",
    "level": 2,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_441"
    ]
  },
  {
    "id": "ex_61",
    "name": "Tuck Dragon Flag Eccentric",
    "level": 3,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_37"
    ]
  },
  {
    "id": "ex_87",
    "name": "Advanced Tuck Dragon Flag",
    "level": 4,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_61"
    ]
  },
  {
    "id": "ex_124",
    "name": "One-Leg / Straddle Dragon Flag",
    "level": 6,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_87"
    ]
  },
  {
    "id": "ex_161",
    "name": "Dragon Flag",
    "level": 8,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_124"
    ],
    "standard": "5 slow reps, body straight"
  },
  {
    "id": "ex_194",
    "name": "Weighted Dragon Flag",
    "level": 9,
    "category": "Core",
    "subCategory": "Hollow Body & Dragon Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_161"
    ]
  },
  {
    "id": "ex_15",
    "name": "Floor Tuck Raise",
    "level": 2,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_441"
    ]
  },
  {
    "id": "ex_367",
    "name": "L-Hang",
    "level": 3,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_15",
      "ex_439"
    ],
    "standard": "10 s hold, legs straight at 90°",
    "youtubeQuery": "L-Hang tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=4Ii0HKuXCHk"
  },
  {
    "id": "ex_60",
    "name": "Bent-Leg Toes-to-Bar",
    "level": 4,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_367"
    ]
  },
  {
    "id": "ex_86",
    "name": "Straddle Toes-to-Bar",
    "level": 5,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_60"
    ]
  },
  {
    "id": "ex_123",
    "name": "Hanging Windshield Wiper",
    "level": 6,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_86"
    ]
  },
  {
    "id": "ex_160",
    "name": "Ankle-Weight Toes-to-Bar",
    "level": 7,
    "category": "Core",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_123"
    ]
  },
  {
    "id": "ex_2",
    "name": "Tuck L-sit",
    "level": 2,
    "category": "Core",
    "subCategory": "L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_441"
    ],
    "steps": [
      "Sit on the floor with your hands flat next to your hips.",
      "Lock your arms straight and push your shoulders down.",
      "Squeeze your abs and tuck your knees into your chest to lift your butt and legs."
    ],
    "standard": "15 s hold",
    "expertTip": "If this is too hard, practice lifting your butt off the ground with heels touching.",
    "youtubeQuery": "Tuck L-Sit Dip tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/IUZJoSP66HI?t=178"
  },
  {
    "id": "ex_20",
    "name": "One-Leg L-sit",
    "level": 3,
    "category": "Core",
    "subCategory": "L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_2"
    ]
  },
  {
    "id": "ex_42",
    "name": "L-sit",
    "level": 4,
    "category": "Core",
    "subCategory": "L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_20"
    ],
    "standard": "10 s hold",
    "youtubeQuery": "Ring L-Sit Dip tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=zMJpC7y-6SE"
  },
  {
    "id": "ex_65",
    "name": "Straddle L-sit",
    "level": 5,
    "category": "Core",
    "subCategory": "L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_42"
    ],
    "youtubeQuery": "Straddle L-Sit tutorial bodyweight fitness"
  },
  {
    "id": "ex_96",
    "name": "Rings Turned-Out L-sit",
    "level": 6,
    "category": "Core",
    "subCategory": "L-sit",
    "swimlane": "Core",
    "prerequisites": [
      "ex_65",
      "ex_28"
    ],
    "youtubeQuery": "RTO L-Sit tutorial bodyweight fitness"
  },
  {
    "id": "ex_134",
    "name": "45° V-sit",
    "level": 7,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_65"
    ]
  },
  {
    "id": "ex_171",
    "name": "75° V-sit",
    "level": 8,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_134"
    ]
  },
  {
    "id": "ex_203",
    "name": "100° V-sit",
    "level": 9,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_171"
    ]
  },
  {
    "id": "ex_236",
    "name": "120° V-sit",
    "level": 10,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_203"
    ]
  },
  {
    "id": "ex_264",
    "name": "140° V-sit",
    "level": 12,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_236"
    ]
  },
  {
    "id": "ex_291",
    "name": "155° V-sit",
    "level": 13,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_264"
    ]
  },
  {
    "id": "ex_312",
    "name": "170° V-sit",
    "level": 14,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_291"
    ]
  },
  {
    "id": "ex_323",
    "name": "Manna",
    "level": 15,
    "category": "Core",
    "subCategory": "V-sit & Manna",
    "swimlane": "Core",
    "prerequisites": [
      "ex_312"
    ],
    "youtubeQuery": "Manna tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=rX4zPm95dAY&feature=youtu.be"
  },
  {
    "id": "ex_386",
    "name": "Side Plank",
    "level": 2,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_30"
    ],
    "standard": "30 s per side",
    "youtubeQuery": "Side Plank tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/44ScXWFaVBs?t=74"
  },
  {
    "id": "ex_387",
    "name": "Vertical Flag",
    "level": 4,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_386",
      "ex_39"
    ],
    "youtubeQuery": "Vertical Flag tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/5PA4zMBwzZo?t=345"
  },
  {
    "id": "ex_114",
    "name": "Tuck Human Flag",
    "level": 6,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_387",
      "ex_45"
    ],
    "youtubeQuery": "Tuck Flag tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=9458-nNR90M"
  },
  {
    "id": "ex_152",
    "name": "Advanced Tuck Human Flag",
    "level": 7,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_114"
    ],
    "youtubeQuery": "Adv Tuck Flag tutorial bodyweight fitness"
  },
  {
    "id": "ex_186",
    "name": "Straddle Human Flag",
    "level": 8,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_152"
    ],
    "youtubeQuery": "Straddle Flag tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/lczvDH9Fze4?t=198"
  },
  {
    "id": "ex_221",
    "name": "Human Flag",
    "level": 9,
    "category": "Core",
    "subCategory": "Human Flag",
    "swimlane": "Core",
    "prerequisites": [
      "ex_186"
    ],
    "standard": "5 s hold",
    "youtubeQuery": "Human Flag tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/lczvDH9Fze4?t=204"
  },
  {
    "id": "ex_12",
    "name": "Glute Bridge",
    "level": 1,
    "category": "Legs",
    "subCategory": "Glute Bridge & Hip Thrust",
    "swimlane": "Legs",
    "prerequisites": [],
    "standard": "3×15"
  },
  {
    "id": "ex_33",
    "name": "Hip Thrust",
    "level": 2,
    "category": "Legs",
    "subCategory": "Glute Bridge & Hip Thrust",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ]
  },
  {
    "id": "ex_56",
    "name": "Single-Leg Glute Bridge",
    "level": 3,
    "category": "Legs",
    "subCategory": "Glute Bridge & Hip Thrust",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_33"
    ]
  },
  {
    "id": "ex_82",
    "name": "Single-Leg Hip Thrust",
    "level": 4,
    "category": "Legs",
    "subCategory": "Glute Bridge & Hip Thrust",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_56"
    ]
  },
  {
    "id": "ex_119",
    "name": "Weighted Hip Thrust",
    "level": 6,
    "category": "Legs",
    "subCategory": "Glute Bridge & Hip Thrust",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_82"
    ]
  },
  {
    "id": "ex_36",
    "name": "Rings Tuck Reverse Hyper",
    "level": 2,
    "category": "Legs",
    "subCategory": "Reverse Hyper",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ]
  },
  {
    "id": "ex_59",
    "name": "Rings Bent-Knee Reverse Hyper",
    "level": 3,
    "category": "Legs",
    "subCategory": "Reverse Hyper",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_36"
    ]
  },
  {
    "id": "ex_85",
    "name": "Straight-Leg Reverse Hyper",
    "level": 4,
    "category": "Legs",
    "subCategory": "Reverse Hyper",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_59"
    ]
  },
  {
    "id": "ex_122",
    "name": "Weighted Reverse Hyper",
    "level": 6,
    "category": "Legs",
    "subCategory": "Reverse Hyper",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_85"
    ]
  },
  {
    "id": "ex_13",
    "name": "Hamstring Slide",
    "level": 2,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ]
  },
  {
    "id": "ex_34",
    "name": "Single-Leg Hamstring Slide Eccentric",
    "level": 3,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_13"
    ]
  },
  {
    "id": "ex_57",
    "name": "Single-Leg Hamstring Slide",
    "level": 4,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_34"
    ]
  },
  {
    "id": "ex_83",
    "name": "Nordic Hip Hinge (Thighs Vertical)",
    "level": 5,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_57"
    ]
  },
  {
    "id": "ex_120",
    "name": "Nordic Curl Eccentric",
    "level": 6,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_83"
    ]
  },
  {
    "id": "ex_158",
    "name": "Nordic Curl",
    "level": 7,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_120"
    ]
  },
  {
    "id": "ex_192",
    "name": "Arms-Overhead Nordic Curl",
    "level": 8,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_158"
    ]
  },
  {
    "id": "ex_225",
    "name": "Weighted Nordic Curl",
    "level": 9,
    "category": "Legs",
    "subCategory": "Nordic Curl",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_192"
    ]
  },
  {
    "id": "ex_11",
    "name": "Parallel Squat",
    "level": 1,
    "category": "Legs",
    "subCategory": "Squat & Pistol",
    "swimlane": "Legs",
    "prerequisites": [],
    "steps": [
      "Stand feet shoulder-width apart.",
      "Squat down until thighs are parallel to the floor.",
      "Drive up through heels."
    ],
    "standard": "3×15",
    "expertTip": "Keep chest high and knees aligned with toes."
  },
  {
    "id": "ex_32",
    "name": "Full Squat",
    "level": 2,
    "category": "Legs",
    "subCategory": "Squat & Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_11"
    ]
  },
  {
    "id": "ex_55",
    "name": "Side-to-Side Squat",
    "level": 3,
    "category": "Legs",
    "subCategory": "Squat & Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_32"
    ]
  },
  {
    "id": "ex_81",
    "name": "Pistol Squat",
    "level": 5,
    "category": "Legs",
    "subCategory": "Squat & Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_55",
      "ex_35"
    ],
    "standard": "5 per leg"
  },
  {
    "id": "ex_118",
    "name": "1.2x Bodyweight Pistol",
    "level": 6,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_81"
    ]
  },
  {
    "id": "ex_157",
    "name": "1.35x Bodyweight Pistol",
    "level": 7,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_118"
    ]
  },
  {
    "id": "ex_191",
    "name": "1.5x Bodyweight Pistol",
    "level": 8,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_157"
    ]
  },
  {
    "id": "ex_224",
    "name": "1.65x Bodyweight Pistol",
    "level": 9,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_191"
    ]
  },
  {
    "id": "ex_254",
    "name": "1.8x Bodyweight Pistol",
    "level": 10,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_224"
    ]
  },
  {
    "id": "ex_283",
    "name": "1.9x Bodyweight Pistol",
    "level": 12,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_254"
    ]
  },
  {
    "id": "ex_306",
    "name": "2x Bodyweight Pistol",
    "level": 13,
    "category": "Legs",
    "subCategory": "Weighted Pistol",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_283"
    ]
  },
  {
    "id": "ex_14",
    "name": "Lunge",
    "level": 2,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_11"
    ]
  },
  {
    "id": "ex_35",
    "name": "Rear-Foot-Elevated Split Squat",
    "level": 3,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_14"
    ]
  },
  {
    "id": "ex_58",
    "name": "Beginner Shrimp Squat",
    "level": 4,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_35"
    ]
  },
  {
    "id": "ex_84",
    "name": "Intermediate Shrimp Squat",
    "level": 5,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_58"
    ]
  },
  {
    "id": "ex_121",
    "name": "Advanced Shrimp Squat",
    "level": 6,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_84"
    ]
  },
  {
    "id": "ex_159",
    "name": "Two-Hand Shrimp Squat",
    "level": 7,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_121"
    ]
  },
  {
    "id": "ex_193",
    "name": "Deficit Advanced Shrimp Squat",
    "level": 8,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_159"
    ]
  },
  {
    "id": "ex_226",
    "name": "Deficit Two-Hand Shrimp Squat",
    "level": 9,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_193"
    ]
  },
  {
    "id": "ex_255",
    "name": "Weighted Elevated Shrimp Squat",
    "level": 10,
    "category": "Legs",
    "subCategory": "Shrimp Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_226"
    ]
  },
  {
    "id": "ex_88",
    "name": "Natural Leg Extension",
    "level": 4,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_32"
    ]
  },
  {
    "id": "ex_126",
    "name": "Sissy Squat",
    "level": 6,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_88"
    ]
  },
  {
    "id": "ex_163",
    "name": "Matrix Squat to Floor",
    "level": 7,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_126"
    ]
  },
  {
    "id": "ex_196",
    "name": "Elevated Matrix Squat",
    "level": 8,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_163"
    ]
  },
  {
    "id": "ex_228",
    "name": "Single-Leg Matrix Squat",
    "level": 9,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_196"
    ]
  },
  {
    "id": "ex_258",
    "name": "Single-Leg Natural Leg Extension",
    "level": 10,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_228"
    ]
  },
  {
    "id": "ex_286",
    "name": "Single-Leg Sissy Squat",
    "level": 12,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_258"
    ]
  },
  {
    "id": "ex_309",
    "name": "Single-Leg Matrix Squat to Floor",
    "level": 13,
    "category": "Legs",
    "subCategory": "Sissy & Matrix Squats",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_286"
    ]
  },
  {
    "id": "ex_406",
    "name": "Reverse Plank",
    "level": 1,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [],
    "standard": "30 s hold",
    "youtubeQuery": "Reverse Plank tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/44ScXWFaVBs?t=244"
  },
  {
    "id": "ex_408",
    "name": "Table Bridge",
    "level": 2,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_406"
    ],
    "youtubeQuery": "Table Bridge tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/Q7dwu5H6c_0?t=50"
  },
  {
    "id": "ex_409",
    "name": "Angled Bridge",
    "level": 3,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_408"
    ],
    "youtubeQuery": "Angled Bridge tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=ciaiYLEBC80"
  },
  {
    "id": "ex_410",
    "name": "Full Bridge",
    "level": 4,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_409"
    ],
    "standard": "10 s hold, arms straight",
    "youtubeQuery": "Bridge / Wheel tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=m-yYUvddRss"
  },
  {
    "id": "ex_411",
    "name": "Decline Bridge",
    "level": 5,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_410"
    ],
    "youtubeQuery": "Decline Bridge tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/QjNWHMON6Tc?t=75"
  },
  {
    "id": "ex_412",
    "name": "One-Leg Bridge",
    "level": 6,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_411"
    ],
    "youtubeQuery": "One Leg Bridge tutorial bodyweight fitness"
  },
  {
    "id": "ex_413",
    "name": "Decline One-Leg Bridge",
    "level": 7,
    "category": "Core",
    "subCategory": "Back Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_412"
    ],
    "youtubeQuery": "Decline OL Bridge tutorial bodyweight fitness"
  },
  {
    "id": "ex_404",
    "name": "One-Arm Head Bridge",
    "level": 5,
    "category": "Core",
    "subCategory": "One-Arm Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_410"
    ],
    "youtubeQuery": "Head Bridge tutorial bodyweight fitness",
    "videoSearchUrl": "https://www.youtube.com/watch?v=SNPUXA8V1qc"
  },
  {
    "id": "ex_405",
    "name": "One-Arm Bridge",
    "level": 7,
    "category": "Core",
    "subCategory": "One-Arm Bridge",
    "swimlane": "Core",
    "prerequisites": [
      "ex_404"
    ],
    "youtubeQuery": "OA Bridge tutorial bodyweight fitness",
    "videoSearchUrl": "https://youtu.be/NcwijTIZyTU"
  },
  {
    "id": "gym_db_bench",
    "name": "Dumbbell Bench Press",
    "level": 3,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_7"
    ],
    "discipline": "gym",
    "steps": [
      "Lie on a flat bench, feet planted, shoulder blades squeezed together.",
      "Lower the dumbbells to the sides of your chest, forearms vertical.",
      "Press up and slightly in until your arms are straight over your shoulders."
    ],
    "standard": "3×10 at 0.2x BW per dumbbell.",
    "youtubeQuery": "Dumbbell Bench Press proper form",
    "expertTip": "Keep both dumbbells moving at the same speed; the weaker side sets the pace.",
    "focus": "Chest",
    "summary": "Pressing two dumbbells teaches a stable, even press before the barbell.",
    "muscles": [
      "Chest",
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "bench_press",
    "name": "Barbell Bench Press",
    "level": 4,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "gym_db_bench"
    ],
    "discipline": "gym",
    "steps": [
      "Lie with your eyes under the bar, feet planted, shoulder blades pinched and a slight arch.",
      "Unrack and lower the bar to the lower chest, elbows about 45° from your body.",
      "Touch, then press up and slightly back until the arms lock out over the shoulders."
    ],
    "standard": "0.75x BW × 5, bar touching the chest.",
    "youtubeQuery": "Barbell Bench Press proper form",
    "expertTip": "Use a spotter or the rack’s safety arms whenever you press near your limit.",
    "focus": "Chest",
    "summary": "The classic horizontal press: bar to the chest and back to lockout.",
    "muscles": [
      "Chest",
      "Triceps",
      "Front delts"
    ]
  },
  {
    "id": "gym_bench_bodyweight",
    "name": "1x Bodyweight Bench Press",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "bench_press"
    ],
    "discipline": "gym",
    "steps": [
      "Warm up in steps: empty bar, then about 50%, 70% and 85% of the working weight.",
      "Set up the same way every set: shoulder blades pinched, feet driving.",
      "Lower with control, pause a moment on the chest, and press."
    ],
    "standard": "1x BW × 5, paused on the chest.",
    "youtubeQuery": "1x Bodyweight Bench Press proper form",
    "expertTip": "Small plates win: add 1–2.5 kg a week rather than 5 kg jumps.",
    "focus": "Chest",
    "summary": "A classic milestone: bench press your own bodyweight.",
    "muscles": [
      "Chest",
      "Triceps",
      "Front delts"
    ]
  },
  {
    "id": "gym_bench_1_5x",
    "name": "1.5x Bodyweight Bench Press",
    "level": 8,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "gym_bench_bodyweight"
    ],
    "discipline": "gym",
    "steps": [
      "Peak for it: a few weeks of heavy triples and doubles, then a lighter week.",
      "Warm up to about 90% in small jumps and take a full rest before the attempt.",
      "Set up tight, take a big breath, and drive the bar off the chest."
    ],
    "standard": "1.5x BW × 1, paused, with a spotter.",
    "youtubeQuery": "1.5x Bodyweight Bench Press proper form",
    "expertTip": "Test it at most a few times a year. Most progress is made far from your max.",
    "focus": "Chest",
    "summary": "An elite pressing standard: one and a half times your bodyweight.",
    "muscles": [
      "Chest",
      "Triceps",
      "Front delts"
    ]
  },
  {
    "id": "gym_bench_2x",
    "name": "2x Bodyweight Bench Press",
    "level": 12,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "gym_bench_1_5x"
    ],
    "discipline": "gym",
    "steps": [
      "Competition-style bench: touch, a clear pause on the chest, press to lockout, with a spotter; one clean single at 2x BW."
    ],
    "standard": "2x BW × 1, paused.",
    "youtubeQuery": "2x Bodyweight Bench Press proper form",
    "focus": "Chest",
    "summary": "Competition-style bench: touch, a clear pause on the chest, press to lockout, with a spotter.",
    "muscles": [
      "Chest",
      "Triceps",
      "Front delts"
    ]
  },
  {
    "id": "incline_bench",
    "name": "Incline Bench Press",
    "level": 5,
    "category": "Gym",
    "subCategory": "Incline Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "bench_press"
    ],
    "discipline": "gym",
    "steps": [
      "Set the bench to 30–45° and lie with your eyes under the bar.",
      "Lower the bar to the upper chest, just below the collarbones.",
      "Press up in a straight line to lockout above the shoulders."
    ],
    "standard": "0.8x BW × 5.",
    "youtubeQuery": "Incline Bench Press proper form",
    "expertTip": "Lower the incline if your shoulders take over from your chest.",
    "focus": "Upper Chest",
    "summary": "Press from a 30–45° bench to work the upper chest and front shoulders.",
    "muscles": [
      "Upper chest",
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "tricep_pushdown",
    "name": "Cable Triceps Pushdown",
    "level": 3,
    "category": "Gym",
    "subCategory": "Triceps",
    "swimlane": "Push",
    "prerequisites": [
      "ex_7"
    ],
    "discipline": "gym",
    "steps": [
      "Face a high pulley with your elbows tucked against your sides.",
      "Push the handle down until your arms are straight and squeeze the triceps.",
      "Let it rise to chest height without the elbows drifting forwards."
    ],
    "standard": "3×12 at 0.3x BW, elbows still.",
    "youtubeQuery": "Cable Triceps Pushdown proper form",
    "expertTip": "If the elbows move, the weight is too heavy and the shoulders are taking over.",
    "focus": "Tricep Lockout",
    "summary": "Push a cable handle from chest to thighs with the elbows pinned to your sides.",
    "muscles": [
      "Triceps"
    ]
  },
  {
    "id": "overhead_extension",
    "name": "Overhead Cable Triceps Extension",
    "level": 4,
    "category": "Gym",
    "subCategory": "Triceps",
    "swimlane": "Push",
    "prerequisites": [
      "tricep_pushdown"
    ],
    "discipline": "gym",
    "steps": [
      "Face away from the pulley with the rope behind your head and elbows pointing forwards.",
      "Straighten the arms forwards and up until they lock.",
      "Bend the elbows back slowly until you feel the stretch."
    ],
    "standard": "3×12 at 0.25x BW.",
    "youtubeQuery": "Overhead Cable Triceps Extension proper form",
    "expertTip": "The stretch at the bottom is where this exercise earns its keep. Don’t cut it short.",
    "focus": "Triceps Long Head",
    "summary": "Straighten the arms overhead against a cable to train the long head of the triceps.",
    "muscles": [
      "Triceps"
    ]
  },
  {
    "id": "gym_close_grip_bench",
    "name": "Close-Grip Bench Press",
    "level": 5,
    "category": "Gym",
    "subCategory": "Triceps",
    "swimlane": "Push",
    "prerequisites": [
      "overhead_extension",
      "bench_press"
    ],
    "discipline": "gym",
    "steps": [
      "Grip the bar at shoulder width, no narrower, wrists stacked over the elbows.",
      "Lower to the lower chest with the elbows close to your sides.",
      "Press to lockout and squeeze the triceps at the top."
    ],
    "standard": "0.9x BW × 5, hands shoulder-width.",
    "youtubeQuery": "Close-Grip Bench Press proper form",
    "expertTip": "A grip narrower than your shoulders only strains the wrists.",
    "focus": "Triceps & Lockout",
    "summary": "Bench with the hands shoulder-width apart to move the work onto the triceps.",
    "muscles": [
      "Triceps",
      "Chest"
    ]
  },
  {
    "id": "lateral_raise",
    "name": "Cable Lateral Raise",
    "level": 3,
    "category": "Gym",
    "subCategory": "Side Delts",
    "swimlane": "Push",
    "prerequisites": [
      "ex_1"
    ],
    "discipline": "gym",
    "steps": [
      "Stand side-on to a low pulley and take the handle in the far hand.",
      "Raise the arm out to the side, elbow soft, until the hand reaches shoulder height.",
      "Lower slowly, keeping tension on the cable all the way down."
    ],
    "standard": "3×15 per arm, no swing.",
    "youtubeQuery": "Cable Lateral Raise proper form",
    "expertTip": "Lead with the elbow, not the hand, and stop at shoulder height.",
    "focus": "Middle Deltoids",
    "summary": "Raise the arm out to the side against a low cable to build the side of the shoulder.",
    "muscles": [
      "Side delts"
    ]
  },
  {
    "id": "db_press",
    "name": "Seated Dumbbell Overhead Press",
    "level": 5,
    "category": "Gym",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_41"
    ],
    "discipline": "gym",
    "steps": [
      "Sit upright with your back supported, dumbbells at shoulder height, palms forwards.",
      "Press straight up until the arms lock, dumbbells close together over your head.",
      "Lower under control back to the shoulders."
    ],
    "standard": "3×8 at 0.25x BW per dumbbell.",
    "youtubeQuery": "Seated Dumbbell Overhead Press proper form",
    "expertTip": "Keep your ribs down. Arching the lower back turns it into an incline press.",
    "focus": "Front Delts",
    "summary": "Press two dumbbells overhead from a seat with back support.",
    "muscles": [
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "overhead_press",
    "name": "Standing Overhead Press",
    "level": 7,
    "category": "Gym",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "ex_93"
    ],
    "discipline": "gym",
    "steps": [
      "Bar on the front of the shoulders, grip just outside them, glutes and abs tight.",
      "Press straight up, moving your head back out of the way and then through.",
      "Lock out with the bar over the middle of your feet."
    ],
    "standard": "0.65x BW × 5, strict.",
    "youtubeQuery": "Standing Overhead Press proper form",
    "expertTip": "Squeeze your glutes. It stops the lower back arching under load.",
    "focus": "Shoulders",
    "summary": "Press a barbell from the shoulders to overhead, standing, with no leg drive.",
    "muscles": [
      "Shoulders",
      "Triceps",
      "Core"
    ]
  },
  {
    "id": "cable_row",
    "name": "Seated Cable Row",
    "level": 3,
    "category": "Gym",
    "subCategory": "Barbell & Cable Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_22"
    ],
    "discipline": "gym",
    "steps": [
      "Sit tall with your feet on the platform and knees soft.",
      "Pull the handle to your belly, squeezing the shoulder blades together.",
      "Let the arms straighten forwards without rounding your back."
    ],
    "standard": "3×10 at 0.6x BW, pause at the belly.",
    "youtubeQuery": "Seated Cable Row proper form",
    "expertTip": "Pause one second at the belly. If you can’t, the stack is too heavy.",
    "focus": "Horizontal Power",
    "summary": "Row a cable handle to your belly from a seat, chest tall.",
    "muscles": [
      "Mid back",
      "Lats",
      "Biceps"
    ]
  },
  {
    "id": "barbell_row",
    "name": "Barbell Row",
    "level": 4,
    "category": "Gym",
    "subCategory": "Barbell & Cable Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "cable_row",
      "gym_kb_deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Hinge at the hips with a flat back until your torso is close to parallel.",
      "Row the bar to the lower chest, elbows going back past your body.",
      "Lower until the arms are straight without your torso rising."
    ],
    "standard": "0.6x BW × 5, torso near parallel.",
    "youtubeQuery": "Barbell Row proper form",
    "expertTip": "If your torso rises to move the bar, the weight is too heavy.",
    "focus": "Upper Back",
    "summary": "Hinge forwards and row a barbell to the lower chest.",
    "muscles": [
      "Upper back",
      "Lats",
      "Biceps"
    ]
  },
  {
    "id": "gym_pendlay_row",
    "name": "Pendlay Row",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell & Cable Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "barbell_row"
    ],
    "discipline": "gym",
    "steps": [
      "Bar on the floor over your mid-foot, torso parallel, back flat.",
      "Row it explosively to the lower chest.",
      "Return it to the floor and reset before the next rep."
    ],
    "standard": "0.8x BW × 5, dead stop each rep.",
    "youtubeQuery": "Pendlay Row proper form",
    "expertTip": "Every rep starts from zero, so momentum can’t help. That’s the point.",
    "focus": "Upper Back Power",
    "summary": "A strict row from a dead stop on the floor, torso parallel.",
    "muscles": [
      "Upper back",
      "Lats",
      "Lower back"
    ]
  },
  {
    "id": "gym_row_bodyweight",
    "name": "1x Bodyweight Barbell Row",
    "level": 8,
    "category": "Gym",
    "subCategory": "Barbell & Cable Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "gym_pendlay_row"
    ],
    "discipline": "gym",
    "steps": [
      "Brace as for a deadlift and hinge to near parallel.",
      "Row to the lower chest, driving the elbows back.",
      "Lower under control and keep the torso still between reps."
    ],
    "standard": "1x BW × 5, torso rising less than a hand's width.",
    "youtubeQuery": "1x Bodyweight Barbell Row proper form",
    "expertTip": "Lifting straps let your back work beyond what your grip can hold.",
    "focus": "Upper Back",
    "summary": "Row your own bodyweight with a strict torso.",
    "muscles": [
      "Upper back",
      "Lats",
      "Lower back"
    ]
  },
  {
    "id": "lat_pulldown",
    "name": "Lat Pulldown",
    "level": 2,
    "category": "Gym",
    "subCategory": "Lat Pulldown",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ],
    "discipline": "gym",
    "steps": [
      "Take a grip a little wider than your shoulders and lock your knees under the pad.",
      "Pull the bar to the top of your chest, leading with the elbows.",
      "Let it rise until the arms are straight and the lats stretch."
    ],
    "standard": "3×10 at 0.5x BW, full stretch.",
    "youtubeQuery": "Lat Pulldown proper form",
    "expertTip": "Think \"elbows to the back pockets\" rather than pulling with the hands.",
    "focus": "Lats",
    "summary": "Pull a wide bar down to the top of your chest from a seat.",
    "muscles": [
      "Lats",
      "Biceps"
    ]
  },
  {
    "id": "gym_weighted_pullup",
    "name": "Weighted Pull-up +0.25x Bodyweight",
    "level": 6,
    "category": "Gym",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_71"
    ],
    "discipline": "gym",
    "steps": [
      "Hang the plate from a dip belt and start from a dead hang.",
      "Pull until the chin clears the bar without kicking.",
      "Lower to straight arms under control."
    ],
    "standard": "+0.25x BW × 5.",
    "youtubeQuery": "Weighted Pull-up +0.25x Bodyweight proper form",
    "expertTip": "Add weight only once you own 12 bodyweight reps.",
    "focus": "Lats & Biceps",
    "summary": "Pull-ups with extra weight hanging from a dip belt.",
    "muscles": [
      "Lats",
      "Biceps",
      "Grip"
    ]
  },
  {
    "id": "cable_curl",
    "name": "Cable Biceps Curl",
    "level": 3,
    "category": "Gym",
    "subCategory": "Weighted Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "lat_pulldown"
    ],
    "discipline": "gym",
    "steps": [
      "Stand facing a low pulley, elbows against your sides.",
      "Curl the handle up to your shoulders without the elbows moving forwards.",
      "Lower until the arms are straight."
    ],
    "standard": "3×12 at 0.25x BW, no swing.",
    "youtubeQuery": "Cable Biceps Curl proper form",
    "expertTip": "The cable keeps tension at the bottom where dumbbells go slack — use the full range.",
    "focus": "Bicep Peak Isolation",
    "summary": "Curl a low cable with the elbows fixed at your sides.",
    "muscles": [
      "Biceps"
    ]
  },
  {
    "id": "hammer_curl",
    "name": "Dumbbell Hammer Curl",
    "level": 4,
    "category": "Gym",
    "subCategory": "Weighted Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "cable_curl"
    ],
    "discipline": "gym",
    "steps": [
      "Stand with dumbbells at your sides, palms facing in.",
      "Curl up without turning the wrists, elbows fixed at your sides.",
      "Lower all the way to straight arms."
    ],
    "standard": "3×10 at 0.2x BW per dumbbell.",
    "youtubeQuery": "Dumbbell Hammer Curl proper form",
    "expertTip": "This one builds the elbow flexors and forearms that pulling needs.",
    "focus": "Brachialis & Forearms",
    "summary": "Curl dumbbells with the palms facing each other.",
    "muscles": [
      "Brachialis",
      "Forearms",
      "Biceps"
    ]
  },
  {
    "id": "face_pulls",
    "name": "Cable Face Pull",
    "level": 3,
    "category": "Gym",
    "subCategory": "Rear Delts",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_22"
    ],
    "discipline": "gym",
    "steps": [
      "Set the pulley at head height and hold the rope with the thumbs pointing back.",
      "Pull the rope towards your eyes, elbows high and hands ending beside your ears.",
      "Return slowly until the arms are straight."
    ],
    "standard": "3×15, 2 s squeeze at the face.",
    "youtubeQuery": "Cable Face Pull proper form",
    "expertTip": "Light and strict. This one protects the shoulders that heavy pressing works.",
    "focus": "Rear Delts & Rotator Cuff",
    "summary": "Pull a rope to your face with the elbows high — shoulder health in one exercise.",
    "muscles": [
      "Rear delts",
      "Rotator cuff",
      "Upper back"
    ]
  },
  {
    "id": "reverse_pec_deck",
    "name": "Reverse Pec Deck",
    "level": 4,
    "category": "Gym",
    "subCategory": "Rear Delts",
    "swimlane": "Pull",
    "prerequisites": [
      "face_pulls"
    ],
    "discipline": "gym",
    "steps": [
      "Sit facing the pad with the handles at shoulder height.",
      "Sweep the arms back and out in a wide arc, arms almost straight.",
      "Return slowly until the hands nearly meet in front."
    ],
    "standard": "3×15, 1 s pause arms open.",
    "youtubeQuery": "Reverse Pec Deck proper form",
    "expertTip": "Keep the shoulder blades still and let the rear delts move the arms.",
    "focus": "Rear Deltoids",
    "summary": "Open the arms wide on the machine to train the back of the shoulders.",
    "muscles": [
      "Rear delts",
      "Upper back"
    ]
  },
  {
    "id": "gym_goblet_squat",
    "name": "Goblet Squat",
    "level": 3,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_32"
    ],
    "discipline": "gym",
    "steps": [
      "Hold a dumbbell upright against your chest, feet a little wider than your hips.",
      "Sit down between your heels, elbows inside your knees, chest up.",
      "Stand up by pushing the floor away."
    ],
    "standard": "3×10 at 0.25x BW, full depth.",
    "youtubeQuery": "Goblet Squat proper form",
    "expertTip": "Use your elbows to nudge the knees out at the bottom.",
    "focus": "Quads & Glutes",
    "summary": "Squat holding one dumbbell at your chest — the way to learn depth and posture.",
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ]
  },
  {
    "id": "back_squat",
    "name": "Barbell Back Squat",
    "level": 4,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_goblet_squat"
    ],
    "discipline": "gym",
    "steps": [
      "Bar on your upper back, hands just outside the shoulders, feet shoulder-width.",
      "Brace, then sit down and slightly back until the hips pass below the knees.",
      "Drive up, keeping your chest up and the knees tracking over the toes."
    ],
    "standard": "1x BW × 5, hip crease below the knee.",
    "youtubeQuery": "Barbell Back Squat proper form",
    "expertTip": "Set the safety bars just below your bottom position before you start.",
    "focus": "Quads & Glutes",
    "summary": "The king of leg lifts: a barbell on your back, hips below the knees.",
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ]
  },
  {
    "id": "gym_squat_1_5x",
    "name": "1.5x Bodyweight Squat",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "back_squat"
    ],
    "discipline": "gym",
    "steps": [
      "Run a block of heavy fives, then threes, adding small plates each week.",
      "Brace with a big breath before every rep; a belt helps.",
      "Sit to depth under control and drive straight up."
    ],
    "standard": "1.5x BW × 3, below parallel.",
    "youtubeQuery": "1.5x Bodyweight Squat proper form",
    "expertTip": "Depth is the standard. A high squat with more weight doesn’t count.",
    "focus": "Quads & Glutes",
    "summary": "An advanced standard: squat one and a half times your bodyweight.",
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ]
  },
  {
    "id": "gym_squat_2x",
    "name": "2x Bodyweight Squat",
    "level": 8,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_squat_1_5x"
    ],
    "discipline": "gym",
    "steps": [
      "Peak with heavy doubles and singles over a few weeks.",
      "Warm up to about 90% in small jumps and rest fully before the attempt.",
      "Brace, descend under control and drive up without the chest folding."
    ],
    "standard": "2x BW × 1, below parallel, with safeties.",
    "youtubeQuery": "2x Bodyweight Squat proper form",
    "expertTip": "Most lifters need years of steady training to get here. Enjoy the road.",
    "focus": "Quads & Glutes",
    "summary": "An elite standard: squat twice your bodyweight.",
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ]
  },
  {
    "id": "gym_squat_2_5x",
    "name": "2.5x Bodyweight Squat",
    "level": 11,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_squat_2x"
    ],
    "discipline": "gym",
    "steps": [
      "Raw back squat (belt allowed, no suit or wraps), hip crease below the knee, with safeties or spotters; one clean single at 2.5x BW."
    ],
    "standard": "2.5x BW × 1, below parallel.",
    "youtubeQuery": "2.5x Bodyweight Squat proper form",
    "focus": "Quads & Glutes",
    "summary": "Raw back squat (belt allowed, no suit or wraps), hip crease below the knee, with safeties or spotters.",
    "muscles": [
      "Quads",
      "Glutes",
      "Core"
    ]
  },
  {
    "id": "gym_front_squat",
    "name": "Front Squat",
    "level": 5,
    "category": "Gym",
    "subCategory": "Front Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "back_squat"
    ],
    "discipline": "gym",
    "steps": [
      "Rest the bar on the front of the shoulders, fingertips under it, elbows pointing forwards.",
      "Squat straight down with the torso upright.",
      "Lead the way up with the elbows so the bar doesn’t roll forwards."
    ],
    "standard": "1x BW × 5, elbows high.",
    "youtubeQuery": "Front Squat proper form",
    "expertTip": "Wrists tight? A cross-arm grip or lifting straps around the bar work too.",
    "focus": "Quads & Upper Back",
    "summary": "Squat with the bar resting on the front of your shoulders, elbows high.",
    "muscles": [
      "Quads",
      "Upper back",
      "Core"
    ]
  },
  {
    "id": "gym_kb_deadlift",
    "name": "Kettlebell Deadlift",
    "level": 2,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ],
    "discipline": "gym",
    "steps": [
      "Stand over the kettlebell with it between your mid-feet.",
      "Push your hips back, keep your back flat, and grab the handle.",
      "Stand up by driving the hips forwards, then lower it the same way."
    ],
    "standard": "3×10 at 0.3x BW, back flat.",
    "youtubeQuery": "Kettlebell Deadlift proper form",
    "expertTip": "Hips back, not knees forward. Your shins stay nearly vertical.",
    "focus": "Hip Hinge",
    "summary": "Lift a kettlebell from between your feet to learn to hinge at the hips.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Lower back"
    ]
  },
  {
    "id": "deadlift",
    "name": "Barbell Deadlift",
    "level": 4,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_kb_deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Bar over your mid-foot, shins close, hands just outside your legs.",
      "Pull the slack out of the bar, chest up and back flat.",
      "Push the floor away and stand tall with the bar against your thighs, then lower it the same way."
    ],
    "standard": "1.25x BW × 5, back flat.",
    "youtubeQuery": "Barbell Deadlift proper form",
    "expertTip": "The bar travels in a straight line up your shins. If it swings out, you lose it.",
    "focus": "Posterior Chain",
    "summary": "Lift a loaded bar from the floor until you stand tall.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Back"
    ]
  },
  {
    "id": "gym_deadlift_2x",
    "name": "2x Bodyweight Deadlift",
    "level": 6,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Use a mixed grip or straps once the grip starts to fail before the back.",
      "Pull the slack out and build tension before the plates leave the floor.",
      "Lock out by squeezing the glutes, not leaning back."
    ],
    "standard": "2x BW × 3, back flat.",
    "youtubeQuery": "2x Bodyweight Deadlift proper form",
    "expertTip": "Heavy deadlifts once a week is plenty. Recovery is part of the program.",
    "focus": "Posterior Chain",
    "summary": "An advanced standard: deadlift twice your bodyweight.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Back"
    ]
  },
  {
    "id": "gym_deadlift_2_5x",
    "name": "2.5x Bodyweight Deadlift",
    "level": 8,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_deadlift_2x"
    ],
    "discipline": "gym",
    "steps": [
      "Peak with heavy singles at 85–90% over several weeks.",
      "Take the slack out of the bar until it clicks against the plates.",
      "Push the floor away and finish tall, then lower it under control."
    ],
    "standard": "2.5x BW × 1, full lockout.",
    "youtubeQuery": "2.5x Bodyweight Deadlift proper form",
    "expertTip": "Chalk and a flat-soled shoe make a real difference at this weight.",
    "focus": "Posterior Chain",
    "summary": "An elite standard: deadlift two and a half times your bodyweight.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Back"
    ]
  },
  {
    "id": "gym_deadlift_3x",
    "name": "3x Bodyweight Deadlift",
    "level": 11,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_deadlift_2_5x"
    ],
    "discipline": "gym",
    "steps": [
      "Raw conventional or sumo deadlift (belt allowed, no straps), flat back, hips and knees locked at the top; one clean single at 3x BW."
    ],
    "standard": "3x BW × 1, full lockout.",
    "youtubeQuery": "3x Bodyweight Deadlift proper form",
    "focus": "Posterior Chain",
    "summary": "Raw conventional or sumo deadlift (belt allowed, no straps), flat back, hips and knees locked at the top.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Back"
    ]
  },
  {
    "id": "leg_curl",
    "name": "Seated Leg Curl",
    "level": 3,
    "category": "Gym",
    "subCategory": "Hamstrings",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_13"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the pad on your lower calves and the thigh pad locked down.",
      "Curl your heels down and back as far as they go.",
      "Let the pad return slowly to straight legs."
    ],
    "standard": "3×12 at 0.4x BW, slow on the way back.",
    "youtubeQuery": "Seated Leg Curl proper form",
    "expertTip": "Point the toes up to keep the calves out of it.",
    "focus": "Hamstrings",
    "summary": "Curl the pad down and under the seat to train the hamstrings.",
    "muscles": [
      "Hamstrings"
    ]
  },
  {
    "id": "gym_rdl",
    "name": "Romanian Deadlift",
    "level": 5,
    "category": "Gym",
    "subCategory": "Hamstrings",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_curl",
      "deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Stand tall holding the bar, knees slightly bent.",
      "Push your hips back and let the bar slide down your thighs until the hamstrings stretch.",
      "Drive the hips forwards to stand tall again."
    ],
    "standard": "1x BW × 8, bar to mid-shin, back flat.",
    "youtubeQuery": "Romanian Deadlift proper form",
    "expertTip": "Stop where your back would start to round, not where the bar touches the floor.",
    "focus": "Hamstrings & Glutes",
    "summary": "Lower the bar down your legs by pushing the hips back, knees soft.",
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Lower back"
    ]
  },
  {
    "id": "walking_lunges",
    "name": "Dumbbell Walking Lunge",
    "level": 3,
    "category": "Gym",
    "subCategory": "Weighted Lunges",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_14"
    ],
    "discipline": "gym",
    "steps": [
      "Take a long step and lower until the back knee nearly touches the floor.",
      "Keep the front shin close to vertical and your torso upright.",
      "Push through the front heel and bring the back foot through into the next step."
    ],
    "standard": "20 steps at 0.15x BW per dumbbell.",
    "youtubeQuery": "Dumbbell Walking Lunge proper form",
    "expertTip": "A longer step loads the glutes; a shorter one loads the quads.",
    "focus": "Quads & Glutes",
    "summary": "Step forwards into a lunge, then step through into the next one.",
    "muscles": [
      "Quads",
      "Glutes",
      "Balance"
    ]
  },
  {
    "id": "split_squat",
    "name": "Dumbbell Bulgarian Split Squat",
    "level": 4,
    "category": "Gym",
    "subCategory": "Weighted Lunges",
    "swimlane": "Legs",
    "prerequisites": [
      "walking_lunges"
    ],
    "discipline": "gym",
    "steps": [
      "Put the top of your back foot on a bench and step the front foot far enough forwards.",
      "Lower straight down until the back knee nearly touches the floor.",
      "Drive up through the front foot."
    ],
    "standard": "3×8 per leg at 0.2x BW per dumbbell.",
    "youtubeQuery": "Dumbbell Bulgarian Split Squat proper form",
    "expertTip": "Most of the weight belongs on the front leg; the back foot is for balance.",
    "focus": "Quads & Glutes",
    "summary": "A split squat with the back foot raised on a bench.",
    "muscles": [
      "Quads",
      "Glutes",
      "Balance"
    ]
  },
  {
    "id": "calf_raises",
    "name": "Standing Calf Raise",
    "level": 1,
    "category": "Gym",
    "subCategory": "Calves",
    "swimlane": "Legs",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Stand with the balls of your feet on a step and heels hanging off.",
      "Let the heels sink until the calves stretch.",
      "Rise as high as you can and pause before lowering."
    ],
    "standard": "3×15, 1 s pause top and bottom.",
    "youtubeQuery": "Standing Calf Raise proper form",
    "expertTip": "Pauses kill the bounce. The stretch at the bottom does the work.",
    "focus": "Calves",
    "summary": "Rise onto the balls of your feet from a step, with a full stretch below.",
    "muscles": [
      "Calves"
    ]
  },
  {
    "id": "gym_cable_crunch",
    "name": "Cable Crunch",
    "level": 2,
    "category": "Gym",
    "subCategory": "Weighted Crunch",
    "swimlane": "Core",
    "prerequisites": [
      "ab_crunch_machine",
      "ex_441"
    ],
    "discipline": "gym",
    "steps": [
      "Kneel facing the stack with the rope beside your head.",
      "Curl your ribs down towards your hips, rounding the back.",
      "Uncurl slowly, keeping the hips still."
    ],
    "standard": "3×15, spine curling.",
    "youtubeQuery": "Cable Crunch proper form",
    "expertTip": "Keep the rope fixed beside your head; the arms don’t pull.",
    "focus": "Abs",
    "summary": "Kneel under a high cable and crunch your ribs towards your hips.",
    "muscles": [
      "Abs"
    ]
  },
  {
    "id": "gym_hanging_leg_raise",
    "name": "Hanging Leg Raise",
    "level": 4,
    "category": "Gym",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_367"
    ],
    "discipline": "gym",
    "steps": [
      "Hang with straight arms and the shoulders engaged.",
      "Raise the legs straight until they are level with your hips.",
      "Lower slowly to stop the swing."
    ],
    "standard": "10 straight-leg raises to hip height, no swing.",
    "youtubeQuery": "Hanging Leg Raise proper form",
    "expertTip": "Bend the knees until you own the range, then straighten them.",
    "focus": "Abs & Hip Flexors",
    "summary": "Hang from a bar and raise straight legs to hip height.",
    "muscles": [
      "Abs",
      "Hip flexors",
      "Grip"
    ]
  },
  {
    "id": "wrist_curls",
    "name": "Dumbbell Reverse Wrist Curl",
    "level": 1,
    "category": "Gym",
    "subCategory": "Grip & Forearms",
    "swimlane": "Core",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Rest your forearm on a bench or your thigh, palm down, hand over the edge.",
      "Raise the back of the hand as high as it goes.",
      "Lower slowly to a full stretch."
    ],
    "standard": "3×15 per arm, slow both ways.",
    "youtubeQuery": "Dumbbell Reverse Wrist Curl proper form",
    "expertTip": "Light weight, slow reps. These are for tendons, not for records.",
    "focus": "Wrist Tendon Armor",
    "summary": "Lift the back of the hand against a light dumbbell to strengthen the wrist extensors.",
    "muscles": [
      "Wrist extensors",
      "Forearms"
    ]
  },
  {
    "id": "farmers_carry",
    "name": "Farmer's Carry",
    "level": 2,
    "category": "Gym",
    "subCategory": "Grip & Forearms",
    "swimlane": "Core",
    "prerequisites": [
      "wrist_curls"
    ],
    "discipline": "gym",
    "steps": [
      "Deadlift the weights up and stand tall, shoulders down.",
      "Walk with short, quick steps, keeping the weights from swinging.",
      "Set them down the way you picked them up."
    ],
    "standard": "30 m at 0.3x BW per hand.",
    "youtubeQuery": "Farmer's Carry proper form",
    "expertTip": "Squeeze the handles as if trying to crush them. The grip is half the exercise.",
    "focus": "Grip & Trunk",
    "summary": "Walk with a heavy weight in each hand, standing tall.",
    "muscles": [
      "Grip",
      "Traps",
      "Core"
    ]
  },
  {
    "id": "gym_farmers_bodyweight",
    "name": "1x Bodyweight Farmer's Carry",
    "level": 5,
    "category": "Gym",
    "subCategory": "Grip & Forearms",
    "swimlane": "Core",
    "prerequisites": [
      "farmers_carry",
      "deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Pick the weights up with a deadlift, back flat.",
      "Walk tall with short steps and steady breathing.",
      "Put them down under control before your grip opens."
    ],
    "standard": "30 m at 0.5x BW per hand.",
    "youtubeQuery": "1x Bodyweight Farmer's Carry proper form",
    "expertTip": "Chalk helps. Straps don’t count — the grip is the test.",
    "focus": "Grip & Trunk",
    "summary": "Carry your own bodyweight, half in each hand.",
    "muscles": [
      "Grip",
      "Traps",
      "Core"
    ]
  },
  {
    "id": "machine_chest_press",
    "name": "Machine Chest Press",
    "level": 1,
    "category": "Gym",
    "subCategory": "Machine Chest Press",
    "swimlane": "Push",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Set the seat so the handles sit level with the middle of your chest, back flat on the pad.",
      "Press the handles forwards until your arms are straight, without slamming the elbows.",
      "Let them come back slowly until your hands are level with your chest."
    ],
    "standard": "3×10 at 0.4x BW, back on the pad.",
    "youtubeQuery": "Machine Chest Press proper form",
    "expertTip": "Stacks feel different from one machine to the next. Use the number as a guide and beat it next week on the same machine.",
    "focus": "Chest",
    "summary": "The first press for a new lifter: the machine holds the path, so you can load the chest safely from day one.",
    "muscles": [
      "Chest",
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "machine_chest_press_bw",
    "name": "1x Bodyweight Machine Chest Press",
    "level": 4,
    "category": "Gym",
    "subCategory": "Machine Chest Press",
    "swimlane": "Push",
    "prerequisites": [
      "machine_chest_press"
    ],
    "discipline": "gym",
    "steps": [
      "Warm up with two or three lighter sets.",
      "Keep the shoulder blades pinned to the pad as the weight gets heavy.",
      "Press eight full reps, taking two seconds to let the handles back."
    ],
    "standard": "1x BW × 8, full range.",
    "youtubeQuery": "1x Bodyweight Machine Chest Press proper form",
    "expertTip": "When this moves easily, start the barbell bench press light and learn its setup.",
    "focus": "Chest",
    "summary": "Your bodyweight on the stack for eight clean reps: a strong base before the barbell.",
    "muscles": [
      "Chest",
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "pec_deck",
    "name": "Pec Deck Fly",
    "level": 2,
    "category": "Gym",
    "subCategory": "Chest Fly",
    "swimlane": "Push",
    "prerequisites": [
      "machine_chest_press"
    ],
    "discipline": "gym",
    "steps": [
      "Sit tall with the handles level with your chest and the elbows slightly bent.",
      "Bring the arms together in a wide arc until the hands meet in front of you.",
      "Open slowly until you feel a stretch across the chest, then go again."
    ],
    "standard": "3×12 at 0.3x BW, 1 s squeeze.",
    "youtubeQuery": "Pec Deck Fly proper form",
    "expertTip": "Keep the elbow angle fixed. If it opens and closes, the triceps are pressing instead of the chest flying.",
    "focus": "Chest",
    "summary": "Hug the arms together against the machine to isolate the chest.",
    "muscles": [
      "Chest",
      "Front delts"
    ]
  },
  {
    "id": "cable_fly",
    "name": "Cable Crossover Fly",
    "level": 3,
    "category": "Gym",
    "subCategory": "Chest Fly",
    "swimlane": "Push",
    "prerequisites": [
      "pec_deck"
    ],
    "discipline": "gym",
    "steps": [
      "Stand between two high pulleys with a handle in each hand and take a step forwards.",
      "With a soft bend in the elbows, sweep the hands down and together in front of your hips.",
      "Let them rise back slowly until your arms are level with your shoulders."
    ],
    "standard": "3×12 at 0.1x BW per side.",
    "youtubeQuery": "Cable Crossover Fly proper form",
    "expertTip": "The pulley height moves the work: high to low trains the lower chest, low to high the upper chest.",
    "focus": "Chest",
    "summary": "A standing fly with the cables pulling the whole way through the arc.",
    "muscles": [
      "Chest",
      "Front delts"
    ]
  },
  {
    "id": "machine_shoulder_press",
    "name": "Machine Shoulder Press",
    "level": 2,
    "category": "Gym",
    "subCategory": "Machine Shoulder Press",
    "swimlane": "Push",
    "prerequisites": [
      "machine_chest_press"
    ],
    "discipline": "gym",
    "steps": [
      "Set the seat so the handles start level with your shoulders.",
      "Press straight up until the arms are long, back on the pad.",
      "Lower under control to shoulder height."
    ],
    "standard": "3×10 at 0.3x BW.",
    "youtubeQuery": "Machine Shoulder Press proper form",
    "expertTip": "If your lower back peels off the pad, drop the weight before you arch.",
    "focus": "Shoulders",
    "summary": "A guided overhead press: the safe way to start loading the shoulders.",
    "muscles": [
      "Front delts",
      "Side delts",
      "Triceps"
    ]
  },
  {
    "id": "machine_dip",
    "name": "Seated Dip Machine",
    "level": 2,
    "category": "Gym",
    "subCategory": "Dip Machine",
    "swimlane": "Push",
    "prerequisites": [
      "machine_chest_press"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the handles at your sides and your elbows bent.",
      "Press down until your arms are straight, chest up and shoulders down.",
      "Let the handles rise slowly until your elbows reach 90°."
    ],
    "standard": "3×12 at 0.5x BW, elbows tucked.",
    "youtubeQuery": "Seated Dip Machine proper form",
    "expertTip": "Lean a little forwards for more chest, sit upright for more triceps.",
    "focus": "Triceps",
    "summary": "The dip on a machine, to load the triceps before bodyweight dips feel easy.",
    "muscles": [
      "Triceps",
      "Chest",
      "Front delts"
    ]
  },
  {
    "id": "incline_db_press",
    "name": "Incline Dumbbell Press",
    "level": 4,
    "category": "Gym",
    "subCategory": "Incline Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "gym_db_bench"
    ],
    "discipline": "gym",
    "steps": [
      "Set the bench to 30° and sit back with the dumbbells on your thighs.",
      "Kick them up to your shoulders and press up over the upper chest.",
      "Lower until the dumbbells sit just outside your shoulders."
    ],
    "standard": "3×10 at 0.2x BW per dumbbell.",
    "youtubeQuery": "Incline Dumbbell Press proper form",
    "expertTip": "Thirty degrees is enough. Steeper turns it into a shoulder press.",
    "focus": "Upper Chest",
    "summary": "Dumbbells on an incline: the bodybuilder's upper-chest staple.",
    "muscles": [
      "Upper chest",
      "Front delts",
      "Triceps"
    ]
  },
  {
    "id": "skull_crusher",
    "name": "EZ-Bar Skull Crusher",
    "level": 4,
    "category": "Gym",
    "subCategory": "Triceps",
    "swimlane": "Push",
    "prerequisites": [
      "tricep_pushdown"
    ],
    "discipline": "gym",
    "steps": [
      "Lie on a flat bench holding an EZ bar over your shoulders, arms straight.",
      "Bend only at the elbows to lower the bar to just behind your forehead.",
      "Straighten the arms back to the start, elbows pointing at the ceiling."
    ],
    "standard": "3×10 at 0.3x BW.",
    "youtubeQuery": "EZ-Bar Skull Crusher proper form",
    "expertTip": "Taking the bar slightly behind the head gives a bigger stretch and is kinder to the elbows.",
    "focus": "Triceps",
    "summary": "A lying triceps extension with an EZ bar, a classic for arm size.",
    "muscles": [
      "Triceps"
    ]
  },
  {
    "id": "spoto_press",
    "name": "Spoto Press",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "bench_press"
    ],
    "discipline": "gym",
    "steps": [
      "Set up exactly as for your competition bench.",
      "Lower the bar and stop it a finger's width above your chest for one second.",
      "Press from the stop without touching the chest."
    ],
    "standard": "0.8x BW × 5, 1 s stop above the chest.",
    "youtubeQuery": "Spoto Press proper form",
    "expertTip": "The stop shows where your bar path drifts. Film a set from the side.",
    "focus": "Bench Control",
    "summary": "A powerlifting bench variation that builds tightness and strength just off the chest.",
    "muscles": [
      "Chest",
      "Triceps",
      "Front delts"
    ]
  },
  {
    "id": "larsen_press",
    "name": "Larsen Press",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell Bench Press",
    "swimlane": "Push",
    "prerequisites": [
      "bench_press"
    ],
    "discipline": "gym",
    "steps": [
      "Lie on the bench with your legs straight out and your heels off the floor.",
      "Lower the bar to the chest with no leg drive to help you stay tight.",
      "Press to lockout with the upper body alone."
    ],
    "standard": "0.8x BW × 5, legs off the floor.",
    "youtubeQuery": "Larsen Press proper form",
    "expertTip": "If you wobble on the bench, your upper back isn't tight enough yet: pinch the shoulder blades harder.",
    "focus": "Upper-Body Tension",
    "summary": "A bench press with the legs taken out, so the upper back and chest do all the work.",
    "muscles": [
      "Chest",
      "Triceps",
      "Upper back"
    ]
  },
  {
    "id": "push_press",
    "name": "Push Press",
    "level": 8,
    "category": "Gym",
    "subCategory": "Weighted Overhead Press",
    "swimlane": "Push",
    "prerequisites": [
      "overhead_press"
    ],
    "discipline": "gym",
    "steps": [
      "Start with the bar on the front of your shoulders, feet hip-width.",
      "Dip a few centimetres by bending the knees, torso upright.",
      "Drive up through the legs and press the bar to lockout in one move."
    ],
    "standard": "0.85x BW × 3, short dip.",
    "youtubeQuery": "Push Press proper form",
    "expertTip": "Keep the dip short and fast. A deep dip turns it into a squat and the bar drifts forwards.",
    "focus": "Overhead Power",
    "summary": "An overhead press started with a leg drive, to move more than a strict press can.",
    "muscles": [
      "Shoulders",
      "Triceps",
      "Quadriceps"
    ]
  },
  {
    "id": "machine_row",
    "name": "Chest-Supported Machine Row",
    "level": 1,
    "category": "Gym",
    "subCategory": "Machine Row",
    "swimlane": "Pull",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Set the chest pad so you can just reach the handles with straight arms.",
      "Pull the handles to your ribs, squeezing the shoulder blades together.",
      "Let the arms straighten slowly until you feel the upper back stretch."
    ],
    "standard": "3×10 at 0.4x BW, pause at the ribs.",
    "youtubeQuery": "Chest-Supported Machine Row proper form",
    "expertTip": "The pad stops you heaving. If your chest leaves it, the weight is too heavy.",
    "focus": "Upper Back",
    "summary": "A row with the chest supported, so a beginner can load the back without straining the lower back.",
    "muscles": [
      "Lats",
      "Rhomboids",
      "Rear delts",
      "Biceps"
    ]
  },
  {
    "id": "db_row",
    "name": "One-Arm Dumbbell Row",
    "level": 2,
    "category": "Gym",
    "subCategory": "Dumbbell Row",
    "swimlane": "Pull",
    "prerequisites": [
      "machine_row"
    ],
    "discipline": "gym",
    "steps": [
      "Put one knee and one hand on a bench, back flat and parallel to the floor.",
      "Row the dumbbell to your hip, elbow close to your side.",
      "Lower until the arm is straight and the shoulder is stretched."
    ],
    "standard": "3×10 at 0.25x BW per arm.",
    "youtubeQuery": "One-Arm Dumbbell Row proper form",
    "expertTip": "Pull to the hip, not the armpit: it moves the work from the arm to the lats.",
    "focus": "Lats",
    "summary": "Row one dumbbell at a time to train each side of the back on its own.",
    "muscles": [
      "Lats",
      "Rhomboids",
      "Biceps"
    ]
  },
  {
    "id": "db_shrug",
    "name": "Dumbbell Shrug",
    "level": 2,
    "category": "Gym",
    "subCategory": "Traps",
    "swimlane": "Pull",
    "prerequisites": [
      "machine_row"
    ],
    "discipline": "gym",
    "steps": [
      "Stand tall with a dumbbell in each hand, arms straight at your sides.",
      "Lift your shoulders straight up towards your ears.",
      "Hold a second at the top, then lower all the way down."
    ],
    "standard": "3×12 at 0.3x BW per dumbbell, 1 s hold.",
    "youtubeQuery": "Dumbbell Shrug proper form",
    "expertTip": "Go straight up and down. Rolling the shoulders adds nothing and strains the joint.",
    "focus": "Traps",
    "summary": "Shrug heavy dumbbells to build the upper traps.",
    "muscles": [
      "Upper traps",
      "Grip"
    ]
  },
  {
    "id": "t_bar_row",
    "name": "T-Bar Row",
    "level": 5,
    "category": "Gym",
    "subCategory": "Barbell & Cable Rows",
    "swimlane": "Pull",
    "prerequisites": [
      "barbell_row"
    ],
    "discipline": "gym",
    "steps": [
      "Straddle the bar with a V-handle under the plates and hinge to about 45°.",
      "Row the plates to your chest, back flat.",
      "Lower until the arms are straight without letting the chest drop."
    ],
    "standard": "0.75x BW × 8, back flat.",
    "youtubeQuery": "T-Bar Row proper form",
    "expertTip": "Load 10–15 kg plates rather than 20s: smaller plates let the bar reach your chest.",
    "focus": "Mid Back",
    "summary": "A heavy row on a landmine or T-bar machine, a bodybuilding back builder.",
    "muscles": [
      "Lats",
      "Rhomboids",
      "Traps",
      "Biceps"
    ]
  },
  {
    "id": "straight_arm_pulldown",
    "name": "Straight-Arm Cable Pulldown",
    "level": 3,
    "category": "Gym",
    "subCategory": "Lat Pulldown",
    "swimlane": "Pull",
    "prerequisites": [
      "lat_pulldown"
    ],
    "discipline": "gym",
    "steps": [
      "Face a high pulley holding a bar or rope, step back and hinge slightly.",
      "Keeping the arms straight, sweep the bar down in an arc to your thighs.",
      "Let it rise slowly back to head height."
    ],
    "standard": "3×12 at 0.25x BW, arms straight.",
    "youtubeQuery": "Straight-Arm Cable Pulldown proper form",
    "expertTip": "It trains the same straight-arm pull as the front lever, so it pairs well with calisthenics.",
    "focus": "Lats",
    "summary": "Pull a cable down with straight arms to isolate the lats.",
    "muscles": [
      "Lats",
      "Triceps long head",
      "Core"
    ]
  },
  {
    "id": "machine_preacher_curl",
    "name": "Machine Preacher Curl",
    "level": 2,
    "category": "Gym",
    "subCategory": "Machine Preacher Curl",
    "swimlane": "Pull",
    "prerequisites": [
      "machine_row"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with your armpits snug over the top of the pad, upper arms resting on it.",
      "Curl the handles up until your forearms are vertical.",
      "Lower slowly until your arms are almost straight."
    ],
    "standard": "3×12 at 0.2x BW.",
    "youtubeQuery": "Machine Preacher Curl proper form",
    "expertTip": "Stop just short of a full lockout at the bottom: it keeps the tension on and spares the elbows.",
    "focus": "Biceps",
    "summary": "A curl with the arms braced on a pad, so nothing but the biceps can lift.",
    "muscles": [
      "Biceps",
      "Brachialis"
    ]
  },
  {
    "id": "barbell_curl",
    "name": "Barbell Curl",
    "level": 4,
    "category": "Gym",
    "subCategory": "Weighted Curls",
    "swimlane": "Pull",
    "prerequisites": [
      "cable_curl"
    ],
    "discipline": "gym",
    "steps": [
      "Stand tall holding the bar at shoulder width, palms forwards.",
      "Curl the bar up to your shoulders, elbows staying at your sides.",
      "Lower all the way until the arms are straight."
    ],
    "standard": "0.35x BW × 8, no swing.",
    "youtubeQuery": "Barbell Curl proper form",
    "expertTip": "Learn it with your back against a wall. If you need to swing, it's too heavy.",
    "focus": "Biceps",
    "summary": "The classic heavy biceps lift.",
    "muscles": [
      "Biceps",
      "Brachialis",
      "Forearms"
    ]
  },
  {
    "id": "leg_press",
    "name": "Leg Press",
    "level": 1,
    "category": "Gym",
    "subCategory": "Leg Press",
    "swimlane": "Legs",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Sit back with your feet hip-width in the middle of the platform.",
      "Release the safeties and lower until your knees come towards your chest, lower back flat on the pad.",
      "Press back up without snapping the knees straight."
    ],
    "standard": "3×10 with 1x BW of plates.",
    "youtubeQuery": "Leg Press proper form",
    "expertTip": "Go only as deep as your lower back stays flat on the pad. That is your depth for now.",
    "focus": "Quads & Glutes",
    "summary": "The beginner's leg builder: heavy work for the legs with the back supported.",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Adductors"
    ]
  },
  {
    "id": "leg_press_2x",
    "name": "2x Bodyweight Leg Press",
    "level": 4,
    "category": "Gym",
    "subCategory": "Leg Press",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press"
    ],
    "discipline": "gym",
    "steps": [
      "Warm up in a few sets, adding plates each time.",
      "Keep the same foot position and depth as your working sets.",
      "Press ten controlled reps, knees in line with the toes."
    ],
    "standard": "2x BW × 10.",
    "youtubeQuery": "2x Bodyweight Leg Press proper form",
    "expertTip": "Depth before weight: a half rep with more plates builds less than a full one.",
    "focus": "Quads & Glutes",
    "summary": "Twice your bodyweight on the sled for ten: strong legs for an intermediate lifter.",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Adductors"
    ]
  },
  {
    "id": "leg_press_3x",
    "name": "3x Bodyweight Leg Press",
    "level": 7,
    "category": "Gym",
    "subCategory": "Leg Press",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press_2x"
    ],
    "discipline": "gym",
    "steps": [
      "Build up to it over several weeks in small jumps.",
      "Brace hard before each rep and keep your hips down on the seat.",
      "Press eight full reps under control."
    ],
    "standard": "3x BW × 8.",
    "youtubeQuery": "3x Bodyweight Leg Press proper form",
    "expertTip": "Breathe in and brace before each rep, out at the top. Holding your breath for the whole set makes you light-headed.",
    "focus": "Quads & Glutes",
    "summary": "Three times your bodyweight on the sled: advanced leg strength.",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Adductors"
    ]
  },
  {
    "id": "leg_extension",
    "name": "Leg Extension",
    "level": 2,
    "category": "Gym",
    "subCategory": "Leg Extension",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the roller on your lower shins and your knees in line with the machine's pivot.",
      "Straighten the legs fully and squeeze the quads for a second.",
      "Lower slowly until the knees are bent past 90°."
    ],
    "standard": "3×12 at 0.4x BW, 1 s squeeze.",
    "youtubeQuery": "Leg Extension proper form",
    "expertTip": "Line the knee up with the pivot. Out of line, it loads the joint instead of the muscle.",
    "focus": "Quadriceps",
    "summary": "Straighten the knees against a roller to isolate the quads.",
    "muscles": [
      "Quadriceps"
    ]
  },
  {
    "id": "hack_squat",
    "name": "Hack Squat",
    "level": 3,
    "category": "Gym",
    "subCategory": "Hack Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press"
    ],
    "discipline": "gym",
    "steps": [
      "Stand on the platform with your back and shoulders against the pads, feet hip-width.",
      "Release the safeties and squat until your thighs are below parallel.",
      "Drive back up through the whole foot."
    ],
    "standard": "0.75x BW × 8, below parallel.",
    "youtubeQuery": "Hack Squat proper form",
    "expertTip": "Feet further forwards on the platform spare the knees; further back works the quads harder.",
    "focus": "Quadriceps",
    "summary": "A squat on rails: deep, heavy leg work without balancing a bar.",
    "muscles": [
      "Quadriceps",
      "Glutes"
    ]
  },
  {
    "id": "hip_abduction",
    "name": "Hip Abduction Machine",
    "level": 2,
    "category": "Gym",
    "subCategory": "Hip Machines",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the pads on the outside of your knees, back against the seat.",
      "Push the knees apart as far as you can.",
      "Bring them back together slowly, without letting the weights touch down."
    ],
    "standard": "3×15 at 0.5x BW.",
    "youtubeQuery": "Hip Abduction Machine proper form",
    "expertTip": "Lean slightly forwards to bring in more of the glutes.",
    "focus": "Outer Glutes",
    "summary": "Push the knees apart against pads to train the side of the hips.",
    "muscles": [
      "Glute medius",
      "Glute minimus"
    ]
  },
  {
    "id": "hip_adduction",
    "name": "Hip Adduction Machine",
    "level": 2,
    "category": "Gym",
    "subCategory": "Hip Machines",
    "swimlane": "Legs",
    "prerequisites": [
      "leg_press"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the pads on the inside of your knees, legs open as wide as is comfortable.",
      "Squeeze the knees together.",
      "Open slowly back to the start."
    ],
    "standard": "3×15 at 0.5x BW.",
    "youtubeQuery": "Hip Adduction Machine proper form",
    "expertTip": "Start with a narrow range and widen it over the weeks. The inner thighs strain easily.",
    "focus": "Inner Thighs",
    "summary": "Squeeze the knees together against pads to train the inner thighs.",
    "muscles": [
      "Adductors"
    ]
  },
  {
    "id": "seated_calf_raise",
    "name": "Seated Calf Raise",
    "level": 2,
    "category": "Gym",
    "subCategory": "Calves",
    "swimlane": "Legs",
    "prerequisites": [
      "calf_raises"
    ],
    "discipline": "gym",
    "steps": [
      "Sit with the pad on your lower thighs and the balls of your feet on the step.",
      "Rise as high onto your toes as you can and hold for a second.",
      "Lower until your heels are well below the step."
    ],
    "standard": "3×15 at 0.5x BW, full stretch.",
    "youtubeQuery": "Seated Calf Raise proper form",
    "expertTip": "With the knees bent the deep calf muscle does the work. Train it seated and standing for full calves.",
    "focus": "Soleus",
    "summary": "A calf raise with the knees bent, for the deep calf muscle.",
    "muscles": [
      "Soleus",
      "Calves"
    ]
  },
  {
    "id": "glute_kickback",
    "name": "Cable Glute Kickback",
    "level": 2,
    "category": "Gym",
    "subCategory": "Glute Kickback",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ],
    "discipline": "gym",
    "steps": [
      "Strap a cuff to one ankle, face a low pulley and hold the frame.",
      "Kick the leg straight back, squeezing the glute at the top.",
      "Return slowly without arching your lower back."
    ],
    "standard": "3×12 per leg at 0.1x BW.",
    "youtubeQuery": "Cable Glute Kickback proper form",
    "expertTip": "Stop when the hip is straight. Kicking higher only bends the lower back.",
    "focus": "Glutes",
    "summary": "Kick one leg back against a cable to isolate the glutes.",
    "muscles": [
      "Glutes",
      "Hamstrings"
    ]
  },
  {
    "id": "back_extension",
    "name": "45° Back Extension",
    "level": 2,
    "category": "Gym",
    "subCategory": "Back Extension",
    "swimlane": "Legs",
    "prerequisites": [
      "ex_12"
    ],
    "discipline": "gym",
    "steps": [
      "Set the pad just below your hips and hook your heels under the rollers.",
      "Lower your torso, hinging at the hips, until you feel the hamstrings stretch.",
      "Rise until your body is in a straight line, no higher."
    ],
    "standard": "3×12, body straight at the top.",
    "youtubeQuery": "45° Back Extension proper form",
    "expertTip": "Squeeze the glutes at the top instead of arching back past straight.",
    "focus": "Lower Back & Glutes",
    "summary": "Hinge over a 45° bench to strengthen the lower back, glutes and hamstrings.",
    "muscles": [
      "Lower back",
      "Glutes",
      "Hamstrings"
    ]
  },
  {
    "id": "weighted_back_extension",
    "name": "Weighted Back Extension",
    "level": 4,
    "category": "Gym",
    "subCategory": "Back Extension",
    "swimlane": "Legs",
    "prerequisites": [
      "back_extension"
    ],
    "discipline": "gym",
    "steps": [
      "Hug a plate or dumbbell to your chest.",
      "Lower slowly to a full hamstring stretch.",
      "Rise to a straight line and pause for a moment."
    ],
    "standard": "3×10 holding 0.25x BW.",
    "youtubeQuery": "Weighted Back Extension proper form",
    "expertTip": "Hold the weight high on the chest. Held further out, it gets much harder.",
    "focus": "Lower Back & Glutes",
    "summary": "The back extension with a plate, for a strong, durable lower back.",
    "muscles": [
      "Lower back",
      "Glutes",
      "Hamstrings"
    ]
  },
  {
    "id": "box_squat",
    "name": "Box Squat",
    "level": 5,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "back_squat"
    ],
    "discipline": "gym",
    "steps": [
      "Set a box so that sitting on it puts your thighs at parallel.",
      "Squat back with the bar until you sit on the box, staying tight.",
      "Pause a moment, then drive up without rocking."
    ],
    "standard": "1x BW × 5 to a parallel box.",
    "youtubeQuery": "Box Squat proper form",
    "expertTip": "Sit back, don't drop: touch the box under control, then stand.",
    "focus": "Hips & Posterior Chain",
    "summary": "A squat to a box, used by powerlifters to teach depth and power out of the bottom.",
    "muscles": [
      "Glutes",
      "Hamstrings",
      "Quadriceps",
      "Lower back"
    ]
  },
  {
    "id": "pause_squat",
    "name": "Pause Squat",
    "level": 6,
    "category": "Gym",
    "subCategory": "Barbell Squat",
    "swimlane": "Legs",
    "prerequisites": [
      "back_squat"
    ],
    "discipline": "gym",
    "steps": [
      "Squat to your normal depth.",
      "Hold completely still in the bottom for two seconds, braced.",
      "Drive up without bouncing."
    ],
    "standard": "1.25x BW × 3, 2 s pause.",
    "youtubeQuery": "Pause Squat proper form",
    "expertTip": "Count the pause in your head. Most lifters cut it short.",
    "focus": "Strength out of the Hole",
    "summary": "A squat with a dead stop at the bottom, to build strength where most squats fail.",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Lower back"
    ]
  },
  {
    "id": "trap_bar_deadlift",
    "name": "Trap Bar Deadlift",
    "level": 3,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_kb_deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Stand in the middle of the trap bar, feet hip-width.",
      "Hinge and bend the knees to grip the handles, chest up, back flat.",
      "Stand up tall by pushing the floor away."
    ],
    "standard": "1x BW × 5, back flat.",
    "youtubeQuery": "Trap Bar Deadlift proper form",
    "expertTip": "Use the high handles until the setup feels solid; they make the start easier.",
    "focus": "Full-Body Pull",
    "summary": "A deadlift inside a hexagonal bar: easier on the back and a great first heavy pull.",
    "muscles": [
      "Quadriceps",
      "Glutes",
      "Hamstrings",
      "Back"
    ]
  },
  {
    "id": "sumo_deadlift",
    "name": "Sumo Deadlift",
    "level": 6,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Take a wide stance, toes turned out, the bar over the middle of your feet.",
      "Grip inside your knees, chest up, and push the knees out.",
      "Spread the floor with your feet and stand up to lockout."
    ],
    "standard": "1.75x BW × 3, hips through at the top.",
    "youtubeQuery": "Sumo Deadlift proper form",
    "expertTip": "Push the knees out over the toes before the bar leaves the floor.",
    "focus": "Hips & Adductors",
    "summary": "The wide-stance deadlift many powerlifters compete with.",
    "muscles": [
      "Glutes",
      "Adductors",
      "Quadriceps",
      "Back"
    ]
  },
  {
    "id": "deficit_deadlift",
    "name": "Deficit Deadlift",
    "level": 6,
    "category": "Gym",
    "subCategory": "Deadlift",
    "swimlane": "Legs",
    "prerequisites": [
      "deadlift"
    ],
    "discipline": "gym",
    "steps": [
      "Stand on a 5 cm plate or platform with the bar over the middle of your feet.",
      "Set up as for a normal deadlift; your hips will start lower.",
      "Pull to lockout, keeping the back flat as the bar leaves the floor."
    ],
    "standard": "1.5x BW × 3 from a 5 cm deficit.",
    "youtubeQuery": "Deficit Deadlift proper form",
    "expertTip": "Keep the deficit small. More than 5–7 cm usually just rounds the back.",
    "focus": "Strength off the Floor",
    "summary": "A deadlift from a raised platform, to get stronger off the floor.",
    "muscles": [
      "Hamstrings",
      "Glutes",
      "Back",
      "Quadriceps"
    ]
  },
  {
    "id": "total_4x",
    "name": "4x Bodyweight Total",
    "level": 7,
    "category": "Gym",
    "subCategory": "Powerlifting Total",
    "swimlane": "Legs",
    "prerequisites": [
      "gym_squat_1_5x",
      "gym_bench_bodyweight",
      "gym_deadlift_2x"
    ],
    "discipline": "gym",
    "steps": [
      "Run a mock meet in one session: squat first, then bench, then deadlift.",
      "Take three attempts on each lift, opening with a weight you could lift three times.",
      "Add your best squat, bench and deadlift together."
    ],
    "standard": "Squat + bench + deadlift ≥ 4x BW in one session.",
    "youtubeQuery": "4x Bodyweight Total proper form",
    "expertTip": "Open light. A missed opener costs more than a heavy one wins.",
    "focus": "Powerlifting Total",
    "summary": "Your first real total: the three powerlifts adding up to four times your bodyweight.",
    "muscles": [
      "Legs",
      "Chest",
      "Back"
    ]
  },
  {
    "id": "total_5x",
    "name": "5x Bodyweight Total",
    "level": 9,
    "category": "Gym",
    "subCategory": "Powerlifting Total",
    "swimlane": "Legs",
    "prerequisites": [
      "total_4x"
    ],
    "discipline": "gym",
    "steps": [
      "Peak for it: a few weeks of heavier, lower-rep work, then a lighter week.",
      "On the day, lift under competition rules: depth on the squat, a pause on the bench, full lockout on the deadlift.",
      "Add your best three lifts together."
    ],
    "standard": "≥ 5x BW, competition rules.",
    "youtubeQuery": "5x Bodyweight Total proper form",
    "expertTip": "Plan all nine attempts before the day and stick to the plan.",
    "focus": "Powerlifting Total",
    "summary": "A total of five times your bodyweight: a strong, competitive lifter.",
    "muscles": [
      "Legs",
      "Chest",
      "Back"
    ]
  },
  {
    "id": "total_6x",
    "name": "6x Bodyweight Total",
    "level": 11,
    "category": "Gym",
    "subCategory": "Powerlifting Total",
    "swimlane": "Legs",
    "prerequisites": [
      "total_5x"
    ],
    "discipline": "gym",
    "steps": [
      "Train a full meet block with a coach.",
      "Lift under competition rules, ideally at a sanctioned meet.",
      "Add your best three lifts together."
    ],
    "standard": "≥ 6x BW, competition rules.",
    "youtubeQuery": "6x Bodyweight Total proper form",
    "expertTip": "At this level, recovery decides the total: sleep and eat as seriously as you train.",
    "focus": "Powerlifting Total",
    "summary": "A total of six times your bodyweight: elite raw strength.",
    "muscles": [
      "Legs",
      "Chest",
      "Back"
    ]
  },
  {
    "id": "ab_crunch_machine",
    "name": "Ab Crunch Machine",
    "level": 1,
    "category": "Gym",
    "subCategory": "Weighted Crunch",
    "swimlane": "Core",
    "prerequisites": [],
    "discipline": "gym",
    "steps": [
      "Sit with your chest against the pad, or the handles beside your head.",
      "Curl your ribs down towards your hips, rounding the spine.",
      "Uncurl slowly until you are upright again."
    ],
    "standard": "3×15, spine curling.",
    "youtubeQuery": "Ab Crunch Machine proper form",
    "expertTip": "Breathe out as you curl, and think ribs to hips rather than chest to knees.",
    "focus": "Abs",
    "summary": "A weighted crunch on a machine: the simplest way to load the abs.",
    "muscles": [
      "Abs"
    ]
  },
  {
    "id": "captains_chair",
    "name": "Captain's Chair Knee Raise",
    "level": 2,
    "category": "Gym",
    "subCategory": "Hanging Leg Raises",
    "swimlane": "Core",
    "prerequisites": [
      "ex_441"
    ],
    "discipline": "gym",
    "steps": [
      "Step up with your forearms on the pads and your back against the backrest.",
      "Step off and raise your knees towards your chest, curling the hips up.",
      "Lower slowly until your legs hang straight."
    ],
    "standard": "3×12, no swing.",
    "youtubeQuery": "Captain's Chair Knee Raise proper form",
    "expertTip": "Curl the pelvis up at the top. Lifting only the knees mostly trains the hip flexors.",
    "focus": "Lower Abs",
    "summary": "Knee raises on a captain's chair, forearms on the pads: the first step towards hanging leg raises.",
    "muscles": [
      "Abs",
      "Hip flexors"
    ]
  },
  {
    "id": "pallof_press",
    "name": "Cable Pallof Press",
    "level": 2,
    "category": "Gym",
    "subCategory": "Anti-Rotation",
    "swimlane": "Core",
    "prerequisites": [
      "ex_30"
    ],
    "discipline": "gym",
    "steps": [
      "Stand side-on to a cable at chest height, the handle at your chest in both hands.",
      "Press it straight out in front of you and hold for two seconds.",
      "Bring it back to the chest without letting your body turn."
    ],
    "standard": "3×10 per side at 0.1x BW, 2 s hold.",
    "youtubeQuery": "Cable Pallof Press proper form",
    "expertTip": "Squeeze the glutes and keep the hips square. The whole job is not to move.",
    "focus": "Anti-Rotation",
    "summary": "Press a cable straight out and refuse to let it turn you.",
    "muscles": [
      "Obliques",
      "Abs",
      "Glutes"
    ]
  },
  {
    "id": "cable_woodchop",
    "name": "Cable Woodchop",
    "level": 3,
    "category": "Gym",
    "subCategory": "Anti-Rotation",
    "swimlane": "Core",
    "prerequisites": [
      "pallof_press"
    ],
    "discipline": "gym",
    "steps": [
      "Stand side-on to a high pulley, holding the handle in both hands above your shoulder.",
      "Pull it down and across your body to the opposite hip, turning through the hips and trunk.",
      "Return under control to the start."
    ],
    "standard": "3×10 per side at 0.15x BW.",
    "youtubeQuery": "Cable Woodchop proper form",
    "expertTip": "Turn with the hips and the back foot. A chop driven only by the arms trains the arms.",
    "focus": "Rotation",
    "summary": "Pull a cable diagonally across the body to train rotational strength.",
    "muscles": [
      "Obliques",
      "Abs",
      "Shoulders"
    ]
  }
];
