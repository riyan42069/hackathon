# Tech Context — MedTrack AI

## Core Stack
| Layer | Technology |
|---|---|
| Framework | React Native + Expo (~54.0.33) |
| Router | Expo Router v6 (file-based routing) |
| Language | TypeScript |
| Backend | Firebase Firestore + Firebase Auth |
| Notifications | expo-notifications (local, not push) |
| Scanning | expo-camera + barcode scanner + OCR |
| State | React Context API (or Zustand — TBD) |
| Animations | react-native-reanimated v4 |

## Key Dependencies (already installed)
- expo-router ~6.0.23
- react-native-reanimated ~4.1.1
- react-native-gesture-handler ~2.28.0
- react-native-safe-area-context ~5.6.0
- @expo/vector-icons ^15.0.3
- react 19.1.0
- react-native 0.81.5

## Not Yet Installed (need to add)
- firebase (Firestore + Auth SDK)
- expo-camera
- expo-notifications
- expo-barcode-scanner (or use expo-camera's built-in)
- ML Kit / OCR library (TBD)

## Dev Setup
```bash
cd something
npm install
npx expo start        # scan QR with Expo Go
npx expo start --android
npx expo start --ios
```

## Expo Config Notes
- `app.json` slug: `something` (placeholder — rename if needed)
- newArchEnabled: true (React Native new architecture ON)
- Typed routes: enabled
- React Compiler: enabled (experimental)
- Web output: static

## Firebase Structure (Firestore)
```
users/
  {userId}/
    createdAt

medications/
  {medicationId}/
    name, dosage, expiryDate, totalQuantity,
    remainingQuantity, barcodeId, imageUrl

schedules/
  {scheduleId}/
    medicationId, doseTimes[], startDate, endDate

dose_logs/
  {logId}/
    medicationId, scheduledTime, status (taken/missed), timestamp
```

## Auth
- Firebase Anonymous Auth (no login screen required for hackathon)

## Notifications — Alert Logic
- Dose reminder: fires at scheduledTime
- Missed dose: if not logged within 30 min of scheduledTime → mark missed
- Low stock: if remainingQuantity <= threshold → alert
- Expiry: if daysToExpiry <= 30 → warning (also 7d and 1d)
