import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";
import { scheduleMedicationReminder } from './notifications';

function getPatientsCollection() {
  // Instead of: collection(db, "users", user.uid, "patients")
  // We just look at the global root collection:
  return collection(db, "patients");
}
//subscribe to patients collection changes and call the callback with the updated list of patients
export function subscribeToPatients(callback: (patients: any[]) => void) {
  const ref = getPatientsCollection();
  const q = query(ref, orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
}
//add a new patient to the current logged in user's patients collection
export async function addPatient(data: any) {
  // Save to Firebase 
  const ref = getPatientsCollection();
  const docRef = await addDoc(ref, { ...data, createdAt: new Date().toISOString() });

  // Loop through medicines and schedule alarms!
  if (data.medicines && Array.isArray(data.medicines)) {
    for (const med of data.medicines) {
      if (med.pillSchedule) {
        await scheduleMedicationReminder(data.name, med.name, med.pillSchedule);
      }
    }
  }

  return docRef;
}