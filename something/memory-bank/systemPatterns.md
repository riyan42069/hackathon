# System Patterns — MedTrack AI

## Architecture Overview
```
app/                    ← Screens (Expo Router file-based)
├── _layout.tsx         ← Root layout, wrap providers here
├── (tabs)/             ← Main tab navigation
│   ├── _layout.tsx     ← Tab bar definition
│   ├── index.tsx       ← Dashboard (today's meds)
│   └── explore.tsx     ← (placeholder — replace with Inventory or Alerts)
└── modal.tsx           ← Generic modal

components/             ← Reusable UI (no business logic)
hooks/                  ← Custom hooks (Firebase queries, auth state)
services/               ← Firebase logic (to be created)
context/                ← React Context providers (to be created)
constants/              ← Theme, colors, config values
assets/                 ← Images, fonts
```

## Routing Pattern (Expo Router)
- File = route. `app/scan.tsx` → `/scan`
- `(tabs)` group = tab navigator, not a URL segment
- Dynamic routes: `app/medication/[id].tsx` → `/medication/abc123`
- Modals: `Stack.Screen` with `presentation: 'modal'`

## State Management Pattern
- Firebase Auth state → `context/AuthContext.tsx` (wraps entire app in `_layout.tsx`)
- Firestore data → custom hooks in `hooks/` (e.g., `useMedications`, `useDoseLogs`)
- Local UI state → `useState` inside components

## Firebase Access Pattern
- Initialize once in `services/firebase.ts`
- Auth functions in `services/auth.ts`
- Firestore CRUD in `services/firestore.ts`
- Hooks call services and expose data + loading + error state

## Notification Pattern
- Schedule notifications when a medication schedule is saved
- On "Taken" tap: cancel upcoming reminder, log to Firestore, decrement inventory
- On "Skip" tap: log to Firestore, do NOT decrement inventory
- Background task (if needed): check missed doses after 30-min window

## Component Pattern
- `ThemedText` and `ThemedView` for all text/containers (auto dark/light mode)
- Platform-specific files use `.ios.tsx` / `.android.tsx` suffixes
- Icons via `@expo/vector-icons`

## Key Files
| File | Role |
|---|---|
| `app/_layout.tsx` | Root layout — add AuthProvider and Firebase init here |
| `constants/theme.ts` | Colors and design tokens |
| `hooks/use-color-scheme.ts` | Dark/light mode detection |
| `services/firebase.ts` | Firebase app initialization (TO CREATE) |
| `context/AuthContext.tsx` | Global auth state (TO CREATE) |
