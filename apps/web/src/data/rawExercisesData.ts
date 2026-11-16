import { RawExercise } from '@aura/types';

/**
 * The calisthenics skill tree: every exercise with its level (1-20), the
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
    "youtubeQuery": "Ring Wide Pull Up tutorial bodyweight fitness"
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
    "youtubeQuery": "Support Press tutorial bodyweight fitness",
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
      "Keep rings turned out (RTO) for stability."
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
    "name": "Band-Assisted Pull-up",
    "level": 2,
    "category": "Pulling",
    "subCategory": "Weighted Pull-ups",
    "swimlane": "Pull",
    "prerequisites": [
      "ex_439"
    ]
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
    "youtubeQuery": "Adv Tuck FL Row tutorial bodyweight fitness",
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
    "youtubeQuery": "Straddle FL Row tutorial bodyweight fitness"
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
    "youtubeQuery": "OA Straight MU tutorial bodyweight fitness",
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
    "youtubeQuery": "Muscle Up tutorial bodyweight fitness",
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
  }
];
