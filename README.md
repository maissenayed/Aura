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

## Campaign, accounts & deployment

### Accounts and invitations

Each person signs in with their own account (email + password, via [Better Auth](https://www.better-auth.com)) and gets a private campaign. Public sign-up is closed — accounts are only created on the server:

- **Owner setup (once).** While no account exists, `/tracker` shows *Create the owner account*. It asks for the campaign passcode chosen before accounts existed, or the `OWNER_SETUP_CODE` from the server config. The pre-account campaign save moves into the owner's account.
- **Invitations.** The owner opens *Team & invitations* (`/team`, from the account menu), enters an email address and gets a personal link (`/join?token=…`) that works once and expires after 14 days. Only a hash of each token is stored, so a lost link is replaced with *New link*, which also stops the old one working.
- **Emailing invitations** switches on when `RESEND_API_KEY` and `EMAIL_FROM` are set (needs a domain verified with Resend). Until then the owner shares links by hand. Password-reset emails use the same setting; without it, the owner sets a new password for a member from the Team page.

### Your plan and the catalog

Every account has its own **plan**, edited on the Campaign page's *Plan* tab. It starts as the Master Workout & Progression Blueprint (`apps/web/src/data/blueprintPlan.ts`).

A plan only holds choices from the catalog in `apps/web/src/data/campaignCatalog.ts` (exercises, lifts, bosses, milestones, skill trees, tendon armor). Players can't invent items.

Exercises are grouped by skill set, and the Plan tab's exercise picker has a tab for each:

- **Calisthenics:** the curated campaign moves plus every exercise on the Skill Tree page's Calisthenics tree.
- **Gym:** every skill on the Gym tree (`data/gymTree.ts`). Strength standards such as "Squat 2× Bodyweight" log the lift they measure.
- **Bouldering:** session types plus every skill on the Bouldering tree (`data/boulderingTree.ts`), practised over a number of problems.
- **Warm-up & recovery**

Every tree skill keeps its tree id and level, so a mission and its skill-tree node are the same exercise.

What players set themselves:

- which exercises go on which day, with sets and reps from dropdowns (the reps options follow the exercise: reps, seconds, minutes or "continuous");
- which lifts they track, with their own starting and end-game numbers;
- their own targets for bosses and skill-tree gates;
- which skill-tree tiers they already own;
- their bodyweight goal;
- the acts of the campaign map;
- free-text labels: the plan name, day titles and act names.

Anything a choice depends on comes with it:

- an exercise that logs a lift adds that lift;
- a boss adds the earlier bosses and the lifts it needs;
- a skill tree adds the lifts it gates on.

To offer something new, add it to the catalog. Ids there are permanent, because plans and saves refer to them.

The plan is stored as `plan:<userId>` in `campaign_kv` (`GET`/`PUT /api/v1/campaign/plan`) with the same revision check as the save. If two devices save different plans, the editor asks which one to keep.

### How a save travels

The Campaign page keeps progress in three places, in this order:

1. **This browser** (`localStorage`, one entry per account) — every change lands here first, so the game never waits on the network and works offline. Signing out removes the account's copy once it is synced.
2. **The backend** (`/api/v1/campaign`) — each change is pushed with the revision the device last saw. If another device saved first, the backend answers `409`, the two versions are merged field by field, and the result is pushed again.
3. **Postgres** — the `campaign_kv` table, one row per account (`save:<userId>`, plus `plan:<userId>` for the plan). Without a database (a quick local run) the backend falls back to a single open save in `apps/backend/.data/` and accounts switch off.

The browser always calls the backend through the web app's own origin. Locally `apps/web/next.config.ts` proxies `/api/v1/*` and `/api/auth/*` to `http://localhost:3002`; on Vercel, `vercel.json` routes `/api/*` to the NestJS service and everything else to the Next.js service.

### Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | backend | Postgres connection string. Unset → no accounts, single local save. |
| `BETTER_AUTH_SECRET` | backend | Secret for signing sessions (32+ random characters). |
| `BETTER_AUTH_URL` | backend | Public address of the app, e.g. `https://aura-calisthenics.vercel.app`. Invitation links are built from it. |
| `OWNER_SETUP_CODE` | backend | Optional. Lets the owner account be created without the old passcode. |
| `RESEND_API_KEY`, `EMAIL_FROM` | backend | Optional. Turn on invitation and password-reset emails. |
| `CAMPAIGN_DATA_DIR` | backend | Folder for the no-database save. Defaults to `./.data`. |
| `BACKEND_ORIGIN` | web | Where to proxy API calls when the backend is not on `localhost:3002`. |

Locally the backend reads `apps/backend/.env` (git-ignored).

### Database tables

Create or update every table (Better Auth's `user`, `session`, `account`, `verification`, plus `campaign_kv` and `campaign_invite`) against the database in `DATABASE_URL`:

```bash
npm run db:migrate --workspace=@aura/backend
```

It is safe to run repeatedly. Run it again after upgrading Better Auth.
