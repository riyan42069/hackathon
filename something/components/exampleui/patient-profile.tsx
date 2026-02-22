import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- Mock patient data ---
const PATIENT = {
  name: 'Jane Smith',
  id: 'P-7721',
  dob: 'March 14, 1957',
  age: 67,
  gender: 'Female',
  height: '165 cm',
  weight: '72 kg',
  notes: 'Patient has a history of hypertension and type 2 diabetes. Allergic to penicillin.',
};

const MEDICINES = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg · Oral Tablet',
    pillsLeft: 34,
    totalPills: 60,
    pillsPerDay: 2,
    daysPerWeek: 7,
    schedule: '8:00 AM, 8:00 PM',
    days: [true, true, true, true, true, true, true],
    refillNeeded: false,
    status: 'ok',
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg · Tablet',
    pillsLeft: 4,
    totalPills: 30,
    pillsPerDay: 1,
    daysPerWeek: 6,
    schedule: '9:30 AM',
    days: [false, true, true, true, true, true, true],
    refillNeeded: true,
    status: 'critical',
  },
  {
    id: '3',
    name: 'Vitamin D3',
    dosage: '2000 IU · Softgel',
    pillsLeft: 90,
    totalPills: 90,
    pillsPerDay: 1,
    daysPerWeek: 7,
    schedule: '12:00 PM',
    days: [true, true, true, true, true, true, true],
    refillNeeded: false,
    status: 'ok',
  },
];

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Tab = 'profile' | 'medicine';

export default function PatientProfileScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* Patient banner */}
      <View style={styles.patientBanner}>
        <View style={styles.patientAvatarWrapper}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{PATIENT.name.charAt(0)}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{PATIENT.name}</Text>
          <Text style={styles.patientMeta}>ID #{PATIENT.id} · {PATIENT.age} yrs · {PATIENT.gender}</Text>
        </View>
        <View style={styles.editButton}>
          <Ionicons name="pencil-outline" size={16} color="#007AFF" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}>
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medicine' && styles.tabActive]}
          onPress={() => setActiveTab('medicine')}>
          <Text style={[styles.tabText, activeTab === 'medicine' && styles.tabTextActive]}>Medicine</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'profile' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}>

          <View style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="Date of Birth" value={PATIENT.dob} />
            <View style={styles.divider} />
            <InfoRow icon="person-outline" label="Gender" value={PATIENT.gender} />
            <View style={styles.divider} />
            <InfoRow icon="resize-outline" label="Height" value={PATIENT.height} />
            <View style={styles.divider} />
            <InfoRow icon="barbell-outline" label="Weight" value={PATIENT.weight} />
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes / History</Text>
            <Text style={styles.notesText}>{PATIENT.notes}</Text>
          </View>

        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{MEDICINES.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#FF9500' }]}>1</Text>
              <Text style={styles.statLabel}>Refill</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#FF3B30' }]}>1</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
          </View>

          {MEDICINES.map((med) => {
            const pct = Math.round((med.pillsLeft / med.totalPills) * 100);
            const isCritical = med.pillsLeft <= 7;
            return (
              <View key={med.id} style={[styles.medCard, isCritical && styles.medCardCritical]}>

                <View style={styles.medHeader}>
                  <View style={styles.medIconBox}>
                    <Ionicons name="medical-outline" size={22} color="#007AFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                  </View>
                  <View style={[styles.freqBadge, isCritical && { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                    <Text style={[styles.freqText, isCritical && { color: '#FF3B30' }]}>
                      {med.pillsPerDay}x DAILY
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    {isCritical ? (
                      <Text style={styles.criticalLabel}>
                        <Ionicons name="warning-outline" size={12} color="#FF9500" /> Critical Stock
                      </Text>
                    ) : (
                      <Text style={styles.progressLabel}>Inventory</Text>
                    )}
                    <Text style={styles.pillsLeftText}>{med.pillsLeft} / {med.totalPills} pills</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${pct}%` as any },
                      isCritical && { backgroundColor: '#FF9500' },
                    ]} />
                  </View>
                </View>

                {/* Days */}
                <View style={styles.scheduleRow}>
                  <View style={styles.daysRow}>
                    {DAYS.map((d, i) => (
                      <View key={i} style={styles.dayItem}>
                        <Text style={styles.dayLabel}>{d}</Text>
                        <View style={[styles.dayDot, med.days[i] ? styles.dayDotActive : styles.dayDotInactive]} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.scheduleTimeBox}>
                    <Ionicons name="time-outline" size={12} color="#8E8E93" />
                    <Text style={styles.scheduleTimeText}>{med.schedule}</Text>
                  </View>
                </View>

                {/* Refill toggle */}
                <View style={styles.refillRow}>
                  <Text style={styles.refillLabel}>Refill Needed</Text>
                  <View style={[styles.toggleTrack, med.refillNeeded && styles.toggleTrackOn]}>
                    <View style={[styles.toggleThumb, med.refillNeeded && styles.toggleThumbOn]} />
                  </View>
                </View>

              </View>
            );
          })}

          {/* Actions */}
          <TouchableOpacity style={styles.addMedButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addMedText}>Add Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.reportText}>Generate Patient Report</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color="#007AFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  moreButton: { padding: 4 },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  patientAvatarWrapper: { position: 'relative' },
  patientAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: { fontSize: 22, fontWeight: '800', color: '#007AFF' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  patientName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  patientMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '600', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '700', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 60 },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.6, textTransform: 'uppercase' },
  notesText: { fontSize: 14, color: '#3C3C43', fontWeight: '500', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medCardCritical: { borderWidth: 1.5, borderColor: '#FF9500' },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  medDosage: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  freqBadge: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  freqText: { fontSize: 10, fontWeight: '800', color: '#3C3C43', letterSpacing: 0.4 },
  progressSection: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.4 },
  criticalLabel: { fontSize: 11, fontWeight: '700', color: '#FF9500' },
  pillsLeftText: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  scheduleRow: { gap: 8 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayItem: { alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9, fontWeight: '700', color: '#8E8E93' },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayDotActive: { backgroundColor: '#007AFF' },
  dayDotInactive: { backgroundColor: '#E5E5EA' },
  scheduleTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleTimeText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  refillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  refillLabel: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleTrackOn: { backgroundColor: '#34C759' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 20 }] },
  addMedButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  addMedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reportButton: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  reportText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
