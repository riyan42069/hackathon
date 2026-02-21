# hackathon

# 🩺 MedTrack AI — Smart Medication Tracker & Preventive Health Assistant

## 🚀 Hackathon Project (24-Hour Build)

**MedTrack AI** is an intelligent medication tracking application designed to help users manage medicines safely through **smart scanning, automated reminders, inventory tracking, and proactive alerts**.

The app reduces missed doses, expired medications, and medication mismanagement by combining **mobile AI scanning**, **automation**, and real-time health reminders.

---

## 🎯 Problem Statement

Medication mismanagement leads to:

- Missed doses
- Expired medicine usage
- Incorrect dosage tracking
- Poor chronic disease management
- Increased healthcare risks

Many users — especially elderly patients and chronic care patients — struggle to manually track medications.

---

## 💡 Solution

MedTrack AI acts as a **digital medication assistant** that:

✅ Scans medicines using camera  
✅ Extracts medication information automatically  
✅ Tracks stock and expiry dates  
✅ Sends intelligent reminders  
✅ Detects missed medications  
✅ Alerts users before medicines run out  

---

## ✨ Main Features

### 📷 Medicine Scanner
- Scan medicine barcode using camera
- OCR fallback to read medicine labels
- Auto-fill medication details
- User confirmation before saving

### 💊 Medication Management
- Add medicine name, dosage, and frequency
- Store expiry date
- Track pill inventory
- View medication history

### ⏰ Smart Reminders
- Scheduled dose notifications
- Daily medication alerts
- Missed dose detection
- One-tap **Taken / Skip** logging

### ⚠️ Intelligent Alerts
- Expiry warnings (30d / 7d / 1d)
- Low stock alerts
- Missing medication alerts
- Reminder escalation

### 📊 Dashboard
- Today’s medication schedule
- Upcoming doses
- Adherence tracking
- Alert center

---

## 🧱 System Architecture
React Native App (Expo)
│
├── Expo Camera (Scanning)
├── Barcode Scanner
│
├── Firebase Backend
│ ├── Firestore Database
│ └── Authentication
│
└── Local Notification Engine


---

## 🛠️ Tech Stack

### 📱 Frontend
- React Native
- Expo
- Expo Go (Live Demo)
- JavaScript / TypeScript

### 📷 Scanning & AI
- expo-camera
- expo-barcode-scanner
- OCR processing (ML Kit / text parsing)

### ☁️ Backend
- Firebase Firestore
- Firebase Authentication (Anonymous Login)

### 🔔 Notifications
- expo-notifications (Local notifications)

### 🗃️ State Management
- React Context API (or Zustand)

---

## 🗂️ Database Structure (Firestore)

### users
userId
createdAt


### medications

id
name
dosage
expiryDate
totalQuantity
remainingQuantity
barcodeId
imageUrl


### schedules

medicationId
doseTimes[]
startDate
endDate


### dose_logs

medicationId
scheduledTime
status (taken/missed)
timestamp


---

## 🔄 App Workflow

1. User scans medicine
2. App extracts medication details
3. User confirms information
4. User sets schedule and inventory
5. App schedules reminders
6. User logs medication intake
7. System updates stock and triggers alerts

---

## 👥 Team Structure (4 Members)

| Role | Responsibility |
|------|----------------|
| Dev 1 | Scanner + Camera Integration |
| Dev 2 | Scheduling & Notifications |
| Dev 3 | Inventory & Alert Logic |
| Dev 4 | UI/UX + Dashboard + Integration |

---

## ⏱️ Development Timeline (24 Hours)

### Phase 1 — Setup (2 hrs)
- Expo project setup
- Firebase integration
- Navigation structure

### Phase 2 — Core Features (10 hrs)
- Scanner implementation
- Add medication flow
- Scheduling system

### Phase 3 — Logic (6 hrs)
- Reminder notifications
- Inventory tracking
- Alert rules

### Phase 4 — Polish (6 hrs)
- Dashboard UI
- Demo optimization
- Bug fixes

---

## 🧠 Alert Logic

### Dose Reminder

if currentTime === scheduledDose:
sendNotification()


### Missed Medication

if not taken within 30 minutes:
mark missed
notify user
notify nerse


### Low Stock Alert
if remainingQuantity <= threshold:
notify user


### Expiry Alert

if daysToExpiry <= 30:
send warning


---

## 🔒 Privacy Considerations

- Minimal personal data stored
- Local notifications work offline
- No sensitive medical records stored externally

---

## 🎥 Demo Flow (For Judges)

1. Scan medicine
2. Auto-fill details
3. Set reminder
4. Receive notification
5. Mark as taken
6. Show inventory decrease
7. Trigger low-stock alert

---

## 🧑‍💻 Installation

```bash
git clone https://github.com/your-team/medtrack-ai
cd medtrack-ai
npm install
npx expo start

Open the QR code using Expo Go on your mobile device.

✅ Requirements

Node.js

Expo CLI

Expo Go App (Android/iOS)

Firebase Project
