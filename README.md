# ⚡ AURA CALISTHENICS

> **RPG Master Skill Tree, 14kg Hypertrophy Protocol & Interactive 2D Human Muscle Anatomy Engine**

Aura Calisthenics is a modern, high-performance web application designed for bodyweight and weighted calisthenics practitioners. Built with a cyberpunk neon dark aesthetic, it gamifies mastery through an interactive skill tree, provides a 2D interactive human muscle anatomy visualizer, tracks progressive overload protocols, and offers a complete exercise database manager.

---

## 🌟 Key Features

### 1. ⚔️ Gamified RPG Skill Tree (`/`)
- **Interactive Node Graph**: Powered by `@xyflow/react` for intuitive drag, pan, zoom, and node connection visualization.
- **Skill Progression & Unlock Chains**: Progression from Level 1 (Foundation) up to Level 20+ (Pro/Titan skills like Planche, Front Lever, Muscle-Up, and One Arm Handstand).
- **Gamified XP & Athlete Ranks**: Earn XP per mastered exercise, track overall percentage mastery, and level up your athlete status from Novice to Calisthenics Titan.
- **Exercise Detail Inspector**: Step-by-step form cues, video tutorial search integration, and prerequisite unlocking.

### 2. 🧬 Interactive Human Muscle Anatomy Engine (`/anatomy`)
- **70+ Vector Muscle Regions**: Precise 2D vector visualization powered by `body-muscles`.
- **Anterior & Posterior Views**: Seamless toggle between Front (Anterior) and Back (Posterior) anatomical views.
- **Real-Time Hover HUD**: Floating tooltips displaying common muscle names, Latin anatomical classifications, and movement categories.
- **Biomechanics Inspector**: Detailed breakdown of muscle origins, insertions, primary actions, and coach form cues.
- **Targeted Exercises Level Filter**: Filter targeted exercises by level range (Level 1–5 default, Level 6–10, Level 11–15, Level 16+) sorted in ascending level order.

### 3. 🏋️ 14kg Weighted Hypertrophy Protocol (`/tracker`)
- Specialized tracking system for weighted bodyweight progression, rep logs, and strength volume tracking.

### 4. 🛠️ Admin Database & Dataset Manager (`/admin`)
- Live raw exercise data synchronization, JSON export/import, and dataset manipulation tools.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/) & [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Custom Neon Dark Design Tokens
- **Icons**: [Lucide React](https://lucide.react.dev/)
- **Graph Canvas**: [@xyflow/react](https://reactflow.dev/)
- **Vector Anatomy Engine**: [body-muscles](https://www.npmjs.com/package/body-muscles)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js 18+** and **npm** installed on your system.

### Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:maissenayed/Aura-.git
   cd Aura-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev` - Starts the Next.js development server.
- `npm run build` - Builds the application for production.
- `npm start` - Runs the built production server.
- `npm run lint` - Runs ESLint code quality checks.

---

## 📁 Project Architecture

```text
src/
├── app/                  # Next.js App Router routes
│   ├── admin/            # Database management page (/admin)
│   ├── anatomy/          # Interactive Muscle Anatomy page (/anatomy)
│   ├── tracker/          # 14kg Weighted Protocol tracker (/tracker)
│   ├── layout.tsx        # Global App layout & providers
│   └── page.tsx          # RPG Skill Tree main canvas (/ )
├── components/           # Reusable UI components
│   ├── anatomy/          # Anatomy visualizer, inspector & search deck
│   ├── Header.tsx        # Global navigation bar & XP status header
│   ├── SkillTreeCanvas.tsx # React Flow skill tree graph
│   └── ExerciseDetailModal.tsx # Exercise detail & video inspector
├── data/                 # Datasets & anatomical dictionary
│   ├── exercisesData.ts  # Calisthenics exercises list & helpers
│   ├── muscleData.ts     # Master muscle dictionary (origins, insertions, functions)
│   └── rawExercisesData.ts # Raw exercise JSON source dataset
└── types/                # TypeScript type definitions
    └── exercise.ts       # Exercise, Swimlane, and UserProgress interfaces
```

---

## 🛡️ License

This project is open source and available under the MIT License.
