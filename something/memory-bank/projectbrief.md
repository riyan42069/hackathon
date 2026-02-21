# Project Brief — MedTrack AI

## What It Is
A smart medication tracking app built in 24 hours for a hackathon. Helps users manage medicines through scanning, reminders, inventory tracking, and proactive alerts.

## Core Problem
Medication mismanagement — missed doses, expired medicine, incorrect dosage tracking — especially for elderly and chronic care patients.

## Core Requirements
1. Scan medicine via camera (barcode + OCR fallback)
2. Auto-fill and save medication details
3. Schedule dose reminders (local notifications)
4. Track pill inventory and expiry dates
5. Alert users: missed doses, low stock, expiry warnings
6. Dashboard showing today's schedule and adherence

## Project Scope
- 24-hour hackathon build
- 4-person team (scanner dev, notifications dev, inventory/alert dev, UI/dashboard dev)
- Demo flow must work end-to-end for judges

## Out of Scope
- Nurse/caregiver portal (mentioned in alerts but not built)
- Cloud notifications (local only)
- Sensitive medical records storage

## Source of Truth
README.md at project root contains full feature spec, Firestore schema, alert logic, and team structure.
