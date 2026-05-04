<div align="center">

# TaskFlow

<p><strong>Role-based task and project management built with React, Vite, Firebase, Express, and TypeScript.</strong></p>

<p>
	<img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white" alt="React" />
	<img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
	<img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ffca28?style=for-the-badge&logo=firebase&logoColor=111827" alt="Firebase" />
	<img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

</div>

## At a Glance

| Area | Details |
| --- | --- |
| Frontend | React 19, Vite, Motion, Three.js |
| Backend | Express server with Vite middleware in development |
| Data | Firebase Auth + Firestore |
| Styling | Tailwind CSS utility classes |
| UX | Role-aware dashboard, tasks, and projects views |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Express + Vite development server. |
| `npm run build` | Builds the client app for production. |
| `npm run start` | Starts the production server. |
| `npm run preview` | Previews the Vite production build. |
| `npm run clean` | Removes the `dist` folder. |
| `npm run lint` | Runs the TypeScript type check. |

## Import Map

Each section below lists the imports used by that file and what they do.

<details open>
<summary><strong>Runtime and build entry points</strong></summary>

| File | Imports | Purpose |
| --- | --- | --- |
| `server.ts` | `express`, `vite` `createServer`, `path`, `url` `fileURLToPath` | Starts the HTTP server, mounts Vite in development, and serves the production build. |
| `vite.config.ts` | `@tailwindcss/vite`, `@vitejs/plugin-react`, `path`, `vite` `defineConfig` and `loadEnv` | Configures Tailwind, React support, aliases, and environment variables. |
| `src/main.tsx` | `react` `StrictMode`, `react-dom/client` `createRoot`, `./App.tsx`, `./index.css` | Boots the React app and loads global styles. |
| `src/vite-env.d.ts` | `vite/client` | Adds Vite client-side type definitions. |

</details>

<details open>
<summary><strong>App shell and UI components</strong></summary>

| File | Imports | Purpose |
| --- | --- | --- |
| `src/App.tsx` | `./components/AuthProvider` `AuthProvider` and `useAuth`, `react-hot-toast` `Toaster`, `motion/react` `AnimatePresence` and `motion`, `react` `useState`, `./components/Dashboard`, `./components/Sidebar`, `./components/Login`, `./components/TaskCenter`, `./components/ProjectsCenter` | Wires auth, notifications, transitions, and tabbed navigation. |
| `src/components/AuthProvider.tsx` | `react` `createContext`, `useContext`, `useEffect`, `useState`; `firebase/auth` `User`, `onAuthStateChanged`, `signInWithPopup`, `GoogleAuthProvider`, `signOut`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `updateProfile`; `firebase/firestore` `doc`, `getDoc`, `setDoc`; `../lib/firebase` `auth` and `db`; `../types` `Role` and `UserProfile`; `react-hot-toast` `toast` | Maintains authentication state and user profiles. |
| `src/components/Sidebar.tsx` | `lucide-react` `Layout`, `FolderKanban`, `LogOut`, `User`; `./AuthProvider` `useAuth`; `../lib/utils` `cn` | Renders navigation, profile summary, and sign-out. |
| `src/components/Dashboard.tsx` | `react` `useEffect`, `useState`; `lucide-react` `CheckCircle2`, `Clock`, `ListChecks`, `AlertCircle`; `./AuthProvider` `useAuth`; `../lib/api` `api`; `../types` `Task`; `../lib/utils` `formatDate`; `motion/react` `motion` | Shows dashboard stats, recent tasks, and admin assignment views. |
| `src/components/Login.tsx` | `react` `useEffect`, `useRef`, `useState`; `lucide-react` `Layout`, `Lock`, `User`, `AtSign`, `Shield`; `motion/react` `motion` and `AnimatePresence`; `three` `*`; `./AuthProvider` `useAuth`; `../types` `Role` | Provides sign-in/sign-up UI and the animated 3D background. |

</details>

<details open>
<summary><strong>Task and project workflows</strong></summary>

| File | Imports | Purpose |
| --- | --- | --- |
| `src/components/TaskCenter.tsx` | `react` `useEffect`, `useMemo`, `useState`; `react-hot-toast` `toast`; `./AuthProvider` `useAuth`; `../lib/api` `api`; `../types` `Project`, `Task`, `TaskStatus`, `UserProfile`; `../lib/utils` `formatDate` | Handles task assignment, editing, and status updates. |
| `src/components/ProjectsCenter.tsx` | `react` `useEffect`, `useState`; `react-hot-toast` `toast`; `./AuthProvider` `useAuth`; `../lib/api` `api`; `../types` `Project`, `Task`, `UserProfile`; `../lib/utils` `formatDate` | Handles project creation, membership, and project task views. |

</details>

<details open>
<summary><strong>Data and utility layer</strong></summary>

| File | Imports | Purpose |
| --- | --- | --- |
| `src/lib/api.ts` | `firebase/firestore` `addDoc`, `collection`, `doc`, `getDoc`, `getDocs`, `query`, `updateDoc`, `where`; `./firebase` `db`; `../types` `Project`, `Role`, `Task`, `TaskPriority`, `TaskStatus`, `UserProfile` | Central Firestore access layer for users, tasks, projects, and dashboard aggregation. |
| `src/lib/firebase.ts` | `firebase/app` `initializeApp`; `firebase/auth` `getAuth`; `firebase/firestore` `getFirestore`; `../../firebase-applet-config.json` | Initializes Firebase and falls back to local config when environment variables are missing. |
| `src/lib/utils.ts` | `clsx` `ClassValue` and `clsx`; `tailwind-merge` `twMerge` | Provides `cn()` and date formatting helpers. |
| `src/types.ts` | No imports | Defines shared `Role`, `UserProfile`, `Task`, `TaskStatus`, `TaskPriority`, and `Project` types. |

</details>

## Shared Dependencies

- Firebase powers authentication and Firestore-backed data storage.
- React and React DOM provide the UI runtime.
- Motion and Three.js provide animation and the login background scene.
- Lucide, toast notifications, and Tailwind class utilities keep the interface fast and lightweight.

## Notes

- The app expects Firebase environment variables in production.
- `src/lib/firebase.ts` falls back to `firebase-applet-config.json` for local development when the full env set is not present.