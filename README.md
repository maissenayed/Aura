# ⚡ Aura Calisthenics — Monorepo Platform

An enterprise-grade **Turborepo Monorepo** featuring a gamified **RPG Calisthenics Skill Tree**, an **Interactive 2D Human Muscle Anatomy Engine**, a **14kg Weighted Hypertrophy Protocol & Drag-and-Drop Monthly Calendar Schedule**, an **Admin Database Manager**, and a high-performance **NestJS REST API** backend.

---

## 🏛️ Monorepo Architecture

```text
aura-calisthenics-monorepo/
├── apps/
│   ├── web/               # Next.js 16 App Router (Skill Tree, Anatomy Engine, 14kg Protocol & Schedule)
│   ├── admin/             # Next.js 16 App Router (Exercise Dataset Manager & JSON Import/Export)
│   └── backend/           # NestJS REST API Server (Controllers -> Services -> JSON Repository)
├── packages/
│   └── types/             # Shared TypeScript DTOs, entities & interfaces (@aura/types)
├── turbo.json             # Turborepo task pipeline configuration
└── package.json           # Monorepo workspace configuration
```

### 🛠️ Tech Stack & Key Frameworks
- **Frontend Applications**: Next.js 16 (App Router), React 19, `@tanstack/react-query`, `@xyflow/react` (React Flow), `body-muscles`, TailwindCSS v4, Lucide React icons.
- **Backend API**: NestJS, Express, RxJS, TypeScript.
- **Monorepo Build System**: Turborepo (`turbo`), npm workspaces.
- **Storage Layer**: Thread-safe file-based JSON repositories (`apps/backend/src/storage/`).

---

## 🚀 Step-by-Step Local Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.17.0` or higher (Recommended: `v20.x`)
- **npm**: `v10.x` or higher (Included with Node.js)
- **Git**: Installed and configured

Verify Node and npm versions:
```bash
node -v
npm -v
```

---

### 2. Clone the Repository
Clone the repository using SSH or HTTPS and navigate to the project directory:

```bash
git clone git@github.com:maissenayed/Aura.git
cd Aura
```

---

### 3. Install Monorepo Dependencies
Install all workspace dependencies across `apps/*` and `packages/*` in a single command:

```bash
npm install
```

---

### 4. Start Development Mode
Launch all three applications (`apps/web`, `apps/admin`, `apps/backend`) concurrently using Turborepo:

```bash
npm run dev
```

Or run via `npx turbo dev`:
```bash
npx turbo dev
```

---

### 5. Access the Applications

Once launched, open your browser to access each application:

| Application | Description | URL | Port |
| :--- | :--- | :--- | :--- |
| 🌐 **Web App** | Skill Tree, Muscle Anatomy Engine, 14kg Tracker & Schedule | [http://localhost:3000](http://localhost:3000) | `3000` |
| 🛡️ **Admin App** | Exercise Dataset Management & Raw JSON Import/Export | [http://localhost:3001](http://localhost:3001) | `3001` |
| ⚙️ **NestJS API Server** | REST API Endpoints & Persistent JSON Engine | [http://localhost:3002/api/v1](http://localhost:3002/api/v1) | `3002` |

---

## 📱 Features & Applications Guide

### 1. 🌐 Web App (`apps/web` — Port 3000)

- **Gamified RPG Skill Tree (`/`)**:
  - Interactive visual graph of bodyweight skills organized into **Swimlanes** (*Push, Pull, Core, Legs*) and **Levels 1–20+**.
  - Upstream prerequisite tracing (gold highlighting) and downstream unlock paths (emerald highlighting).
  - XP rewards, level progression, and athlete rank calculations.
  - SSR prefetching via `initialData.ts` `pageContext()` and live TanStack React Query mutations.

- **Interactive 2D Human Muscle Anatomy (`/anatomy`)**:
  - Anterior (Front) and Posterior (Back) 2D vector muscle charts powered by `body-muscles`.
  - Hover HUD tooltips displaying common & Latin anatomical names.
  - Biomechanics inspector card detailing origin, insertion, primary function, and form tips.
  - Targeted calisthenics exercises sorted by level (Level 1–5 default range filter).

- **14kg Weighted Hypertrophy Protocol & Monthly Schedule (`/tracker`)**:
  - **14kg Training Plan**: 12-Week Overload Mesocycle split across 3 Phases (*Phase 1: Base Hypertrophy, Phase 2: Peak Strength, Phase 3: Max Density*). Log sets, reps, vest weight (kg), and daily nutrition checklist (*Serious Mass Shake + 5g Creatine Monohydrate*).
  - **Drag & Drop Monthly Schedule**: Drag custom **Week Plan Blocks** onto calendar week slots to structure monthly training cycles.
  - **Week Plan Block Builder**: Create custom week templates with daily routines, sets, reps, and required tools (*14kg Weight Vest, Gymnastic Rings, Parallettes, Dip Belt*).

---

### 2. 🛡️ Admin App (`apps/admin` — Port 3001)

- **Exercise Dataset Manager (`/`)**:
  - Search, filter, edit, and create raw exercise definitions.
  - Configure levels, swimlanes, video links, prerequisites, and step-by-step form cues.
  - Import and export raw dataset JSON files.
  - Persist dataset edits directly to NestJS JSON backend.

---

### 3. ⚙️ NestJS REST API Server (`apps/backend` — Port 3002)

Architecture follows **Controller ➔ Service / Action ➔ JSON Repository**:

| Controller | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **ExercisesController** | `GET` | `/api/v1/exercises` | List exercises with filters (`swimlane`, `minLevel`, `maxLevel`, `search`) |
| **ExercisesController** | `GET` | `/api/v1/exercises/:id` | Get exercise by ID |
| **MuscleAnatomyController**| `GET` | `/api/v1/anatomy/muscles` | Get full muscle anatomy dictionary |
| **MuscleAnatomyController**| `GET` | `/api/v1/anatomy/muscles/:id` | Get single muscle metadata |
| **MuscleAnatomyController**| `GET` | `/api/v1/anatomy/muscles/:id/exercises` | Get level-filtered targeted exercises |
| **UserRpgController** | `GET` | `/api/v1/rpg` | Get user RPG progress & level |
| **UserRpgController** | `POST` | `/api/v1/rpg/toggle-mastered` | Toggle exercise mastered status |
| **UserRpgController** | `POST` | `/api/v1/rpg/unlock-demo` | Unlock foundation demo exercise set |
| **UserRpgController** | `POST` | `/api/v1/rpg/reset` | Reset RPG progress |
| **TrackerController** | `GET` | `/api/v1/tracker/blocks` | List saved Week Plan Blocks |
| **TrackerController** | `POST` | `/api/v1/tracker/blocks` | Create new Week Plan Block |
| **TrackerController** | `PUT` | `/api/v1/tracker/blocks/:id` | Update existing Week Plan Block |
| **TrackerController** | `DELETE` | `/api/v1/tracker/blocks/:id` | Delete Week Plan Block |
| **TrackerController** | `GET` | `/api/v1/tracker/calendar` | Get monthly training schedule |
| **TrackerController** | `POST` | `/api/v1/tracker/calendar/schedule` | Schedule Week Block into calendar |
| **AdminController** | `GET` | `/api/v1/admin/exercises` | Get raw exercise dataset for editing |
| **AdminController** | `POST` | `/api/v1/admin/save-dataset` | Save full raw dataset to JSON storage |

---

## 🛠️ Monorepo CLI Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev servers for **Web**, **Admin**, and **Backend** concurrently |
| `npm run dev:web` | Start **Web App** only on `http://localhost:3000` |
| `npm run dev:admin` | Start **Admin App** only on `http://localhost:3001` |
| `npm run dev:backend` | Start **NestJS Backend** only on `http://localhost:3002` |
| `npm run build` | Build all applications and shared packages for production |
| `npm run lint` | Run ESLint checks across all monorepo workspaces |

---

## 🧪 Verification & Build Check

To verify that the entire monorepo compiles cleanly without TypeScript errors:

```bash
npm run build
```

Expected Output:
```text
 Tasks:    3 successful, 3 total
Cached:    0 cached, 3 total
  Time:    ~6s
```

---

## 📄 License

MIT License. Designed & Developed for Calisthenics Athletes.
