import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ReminderStatus = 'upcoming' | 'done' | 'missed';
interface Reminder { id: string; patient: string; medicine: string; dosage: string; time: string; status: ReminderStatus; urgent: boolean; }

const REMINDERS: { section: string; icon: any; data: Reminder[] }[] = [
  { section: 'Morning', icon: 'sunny-outline', data: [
    { id: '1', patient: 'John Doe', medicine: 'Lisinopril', dosage: '10mg', time: '8:00 AM', status: 'done', urgent: false },
    { id: '2', patient: 'Jane Smith', medicine: 'Metformin', dosage: '500mg', time: '9:30 AM', status: 'upcoming', urgent: true },
  ]},
  { section: 'Afternoon', icon: 'partly-sunny-outline', data: [
    { id: '3', patient: 'Bob Lee', medicine: 'Vitamin D3', dosage: '2000 IU', time: '12:00 PM', status: 'upcoming', urgent: false },
    { id: '4', patient: 'Maria Garcia', medicine: 'Atorvastatin', dosage: '20mg', time: '2:00 PM', status: 'missed', urgent: false },
  ]},
  { section: 'Evening', icon: 'moon-outline', data: [
    { id: '5', patient: 'John Doe', medicine: 'Aspirin', dosage: '81mg', time: '8:00 PM', status: 'upcoming', urgent: false },
    { id: '6', patient: 'Jane Smith', medicine: 'Metformin', dosage: '500mg', time: '9:00 PM', status: 'upcoming', urgent: true },
  ]},
];

function statusStyle(status: ReminderStatus) {
  switch (status) {
    case 'done':     return { bg: '#E8F5E9', text: '#2E7D32', label: 'Done' };
    case 'missed':   return { bg: '#FFEBEE', text: '#C62828', label: 'Missed' };
    case 'upcoming': return { bg: '#EBF4FF', text: '#007AFF', label: 'Upcoming' };
  }
}

export default function RemindersScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reminders</Text>
        <Text style={styles.headerDate}>Today, Feb 21</Text>
      </View>

      <View style={styles.summaryRow}>
        {[['6','#1C1C1E','Total'],['4','#007AFF','Upcoming'],['1','#34C759','Done'],['1','#FF3B30','Missed']].map(([num, color, label]) => (
          <View key={label} style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color }]}>{num}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {REMINDERS.map((group) => (
          <View key={group.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={group.icon} size={16} color="#8E8E93" />
              <Text style={styles.sectionTitle}>{group.section}</Text>
            </View>
            <View style={styles.cardsList}>
              {group.data.map((r) => {
                const s = statusStyle(r.status);
                return (
                  <View key={r.id} style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}>
                    <View style={styles.reminderLeft}>
                      <View style={[styles.pillIcon, { backgroundColor: s.bg }]}>
                        <Ionicons name="medical-outline" size={20} color={s.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.reminderTopRow}>
                          <Text style={styles.medicineName}>{r.medicine}</Text>
                          {r.urgent && (
                            <View style={styles.lowStockBadge}>
                              <Text style={styles.lowStockText}>LOW STOCK</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dosageText}>{r.dosage} · {r.patient}</Text>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={13} color="#8E8E93" />
                          <Text style={styles.timeText}>{r.time}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  headerDate: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardsList: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  reminderCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reminderCardUrgent: { borderWidth: 1.5, borderColor: '#FF9500' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pillIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medicineName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  lowStockBadge: { backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  lowStockText: { fontSize: 9, fontWeight: '800', color: '#FF9500', letterSpacing: 0.4 },
  dosageText: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
