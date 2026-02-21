# Product Context — MedTrack AI

## Why This Exists
Medication mismanagement is a real healthcare risk, particularly for elderly users and those managing chronic conditions. Manual tracking is error-prone. MedTrack AI automates the tedious parts.

## Who Uses It
- Elderly patients managing multiple medications
- Chronic disease patients (diabetes, hypertension, etc.)
- Anyone who struggles to remember doses or track pill counts

## How It Should Work (User Journey)
1. Open app → scan medicine barcode with camera
2. App auto-fills: name, dosage, expiry — user confirms
3. User sets schedule (dose times) and starting inventory count
4. App schedules local notifications for each dose time
5. At dose time: notification fires → user taps "Taken" or "Skip"
6. Inventory decrements on "Taken"
7. Alerts fire automatically: low stock, expiry, missed dose

## UX Goals
- Minimal friction — scan once, everything else is automated
- Clear dashboard showing today's meds at a glance
- One-tap dose logging (Taken / Skip)
- Non-technical users must be able to use it without help

## Demo Flow (for judges — must work perfectly)
1. Scan medicine → auto-fill
2. Set reminder → receive notification
3. Mark as taken → inventory decreases
4. Trigger low-stock alert
