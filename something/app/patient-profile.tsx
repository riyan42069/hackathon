import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Medicine {
  name: string;
  totalPillsPrescribed: string;
  pillsPerDayToBeTaken: string;
  daysPerWeekToTakeThePrescription: string;
  pillSchedule: string;
  refillOrNot: boolean;
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
  dob?: string;
  age?: string | number;
  gender?: string;
  height?: string;
  weight?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  notes?: string;
  status?: string;
  medicines?: Medicine[];
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}><Ionicons name={icon} size={16} color="#007AFF" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function PatientProfileScreen() {
  const [activeTab, setActiveTab] = useState<'profile' | 'medicine'>('profile');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !db) return;
    const unsub = onSnapshot(doc(db, 'patients', id), (snap) => {
      if (snap.exists()) {
        setPatient({ id: snap.id, ...snap.data() } as Patient);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#8E8E93', fontSize: 16 }}>Patient not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const medicines: Medicine[] = patient.medicines || [];
  const refillCount = medicines.filter(m => m.refillOrNot).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientBanner}>
        <View style={styles.patientAvatarWrapper}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{patient.name.charAt(0)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientMeta}>
            ID #{patient.patientId}
            {patient.dob || patient.age ? ` · ${patient.dob || patient.age}` : ''}
            {patient.gender ? ` · ${patient.gender}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['profile', 'medicine'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'profile' ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}>
          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline"  label="Date of Birth" value={patient.dob || ''} />
            <View style={styles.divider} />
            <InfoRow icon="person-outline"    label="Gender"        value={patient.gender || ''} />
            <View style={styles.divider} />
            <InfoRow icon="resize-outline"    label="Height"        value={patient.height || ''} />
            <View style={styles.divider} />
            <InfoRow icon="barbell-outline"   label="Weight"        value={patient.weight || ''} />
            <View style={styles.divider} />
            <InfoRow icon="call-outline"      label="Phone"         value={patient.phone || ''} />
            <View style={styles.divider} />
            <InfoRow icon="mail-outline"      label="Email"         value={patient.email || ''} />
            <View style={styles.divider} />
            <InfoRow icon="alert-circle-outline" label="Emergency Contact" value={patient.emergencyContact || ''} />
          </View>
          {patient.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>NOTES / HISTORY</Text>
              <Text style={styles.notesText}>{patient.notes}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}>
          <View style={styles.statsRow}>
            {([
              [String(medicines.length), '#1C1C1E', 'Total'],
              [String(refillCount),      '#FF9500', 'Refill'],
            ] as [string, string, string][]).map(([n, c, l]) => (
              <View key={l} style={styles.statCard}>
                <Text style={[styles.statNumber, { color: c }]}>{n}</Text>
                <Text style={styles.statLabel}>{l}</Text>
              </View>
            ))}
          </View>

          {medicines.length === 0 ? (
            <View style={styles.emptyMeds}>
              <Ionicons name="medical-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyMedsText}>No medicines added yet</Text>
            </View>
          ) : (
            medicines.map((med, idx) => (
              <View key={idx} style={[styles.medCard, med.refillOrNot && styles.medCardRefill]}>
                <View style={styles.medHeader}>
                  <View style={styles.medIconBox}>
                    <Ionicons name="medical-outline" size={22} color="#007AFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.pillsPerDayToBeTaken} pill(s)/day</Text>
                  </View>
                  {med.refillOrNot && (
                    <View style={styles.refillBadge}>
                      <Text style={styles.refillBadgeText}>REFILL</Text>
                    </View>
                  )}
                </View>

                <View style={styles.medDetails}>
                  {med.pillSchedule ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color="#8E8E93" />
                      <Text style={styles.detailText}>{med.pillSchedule}</Text>
                    </View>
                  ) : null}
                  {med.totalPillsPrescribed ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="layers-outline" size={14} color="#8E8E93" />
                      <Text style={styles.detailText}>Total prescribed: {med.totalPillsPrescribed} pills</Text>
                    </View>
                  ) : null}
                  {med.daysPerWeekToTakeThePrescription ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                      <Text style={styles.detailText}>{med.daysPerWeekToTakeThePrescription} day(s) per week</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  patientBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  patientAvatarWrapper: { position: 'relative' },
  patientAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 22, fontWeight: '800', color: '#007AFF' },
  patientName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  patientMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  infoCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoIconBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '700', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 60 },
  notesCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.6 },
  notesText: { fontSize: 14, color: '#3C3C43', fontWeight: '500', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  emptyMeds: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyMedsText: { fontSize: 16, color: '#8E8E93', fontWeight: '600' },
  medCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  medCardRefill: { borderWidth: 1.5, borderColor: '#FF9500' },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  medName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  medDosage: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  refillBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  refillBadgeText: { fontSize: 10, fontWeight: '800', color: '#FF9500', letterSpacing: 0.4 },
  medDetails: { gap: 6, paddingLeft: 58 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#3C3C43', fontWeight: '500' },
});
