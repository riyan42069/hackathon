# Progress — MedTrack AI

## What Works
- [x] Expo project bootstrapped (expo-router, TypeScript, reanimated)
- [x] Tab navigation shell (`app/(tabs)/`)
- [x] Dark/light theme system (`ThemedText`, `ThemedView`, `constants/theme.ts`)
- [x] Root layout with ThemeProvider (`app/_layout.tsx`)
- [x] Project README with full spec, schema, and team roles

## What's Left to Build

### Phase 1 — Setup
- [ ] Firebase SDK installed and initialized (`services/firebase.ts`)
- [ ] Anonymous auth on app load (`context/AuthContext.tsx`)
- [ ] Tab screens renamed/restructured for actual features
- [ ] `expo-camera` installed
- [ ] `expo-notifications` installed and permissions requested

### Phase 2 — Core Features
- [ ] Scan screen — camera + barcode reading
- [ ] OCR fallback for medicine label reading
- [ ] Add medication form (confirm auto-filled details)
- [ ] Save medication to Firestore
- [ ] Schedule screen — set dose times
- [ ] Save schedule to Firestore and schedule local notifications

### Phase 3 — Logic
- [ ] Dose logging (Taken / Skip) → updates Firestore + decrements inventory
- [ ] Missed dose detection (30-min window check)
- [ ] Low stock alert rule (remainingQuantity <= threshold)
- [ ] Expiry alert rule (daysToExpiry <= 30, 7, 1)
- [ ] Alert center screen

### Phase 4 — Polish
- [ ] Dashboard (today's schedule, adherence summary)
- [ ] Demo mode / seed data for judges
- [ ] Bug fixes and UI polish

## Known Issues
- None yet (project just started)

## Decisions Made
| Decision | Choice | Reason |
|---|---|---|
| Router | Expo Router | Already set up, file-based is fast |
| Auth | Firebase Anonymous | No login screen, saves time |
| Notifications | Local (expo-notifications) | No backend push infra needed |
| Database | Firestore | Real-time, easy auth integration |
