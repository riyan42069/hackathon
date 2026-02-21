# Active Context — MedTrack AI

## Current Status
**Phase 1 — Setup** (in progress)

Expo project scaffolded. Basic tab navigation and theming in place. Firebase and feature screens NOT yet built.

## What Was Just Done
- Expo project created with Expo Router, tab navigation, dark/light theming
- README finalized with full feature spec and Firestore schema
- Memory Bank initialized

## Immediate Next Steps (Phase 1 — Setup)
1. Install Firebase SDK: `npm install firebase`
2. Create `services/firebase.ts` — initialize Firebase app with config
3. Create `context/AuthContext.tsx` — anonymous sign-in on app load
4. Wrap `app/_layout.tsx` with `AuthProvider`
5. Install `expo-camera`, `expo-notifications`
6. Set up tab screens to match app features (Dashboard, Scan, Medications, Alerts)

## Active Decisions / Open Questions
- **OCR library**: ML Kit vs expo-camera text recognition — not decided
- **State management**: Context API vs Zustand — not decided (Context is fine for hackathon)
- **App slug**: Currently `"something"` in app.json — should rename to `medtrack` if time allows
- **Scan screen**: Will use expo-camera with barcode scanning; OCR is fallback

## Team Division (reference)
- Dev 1: Scanner + Camera (`app/scan.tsx`, `services/scanner.ts`)
- Dev 2: Scheduling & Notifications (`services/notifications.ts`, `hooks/useSchedule.ts`)
- Dev 3: Inventory & Alert Logic (`services/firestore.ts` inventory section, alert rules)
- Dev 4: UI/UX + Dashboard + Integration (`app/(tabs)/index.tsx`, component polish)

## Important Notes
- This is a 24-hour hackathon — prioritize demo flow over perfect code
- Anonymous Firebase Auth means no login screen needed
- Local notifications only — no FCM/push required
- Judges want to see: scan → remind → log → inventory decrease → alert
