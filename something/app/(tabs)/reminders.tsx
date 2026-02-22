import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
  medicines?: Medicine[];
}

interface ReminderItem {
  id: string;
  patient: string;
  medicine: string;
  schedule: string;
  pillsPerDay: string;
  refillNeeded: boolean;
  group: 'Morning' | 'Afternoon' | 'Evening' | 'Other';
}

function getGroup(schedule: string): 'Morning' | 'Afternoon' | 'Evening' | 'Other' {
  if (!schedule) return 'Other';
  const s = schedule.toUpperCase();
  const amMatch = s.match(/(\d+)(?::\d+)?\s*AM/);
  const pmMatch = s.match(/(\d+)(?::\d+)?\s*PM/);
  if (amMatch) return 'Morning';
  if (pmMatch) {
    const hour = parseInt(pmMatch[1], 10);
    return (hour >= 1 && hour < 6) ? 'Afternoon' : 'Evening';
  }
  if (s.includes('MORNING')) return 'Morning';
  if (s.includes('AFTERNOON') || s.includes('NOON')) return 'Afternoon';
  if (s.includes('EVENING') || s.includes('NIGHT')) return 'Evening';
  return 'Other';
}

const GROUP_CONFIG: { key: 'Morning' | 'Afternoon' | 'Evening' | 'Other'; icon: any; label: string }[] = [
  { key: 'Morning',   icon: 'sunny-outline',        label: 'Morning' },
  { key: 'Afternoon', icon: 'partly-sunny-outline',  label: 'Afternoon' },
  { key: 'Evening',   icon: 'moon-outline',          label: 'Evening' },
  { key: 'Other',     icon: 'time-outline',          label: 'Other' },
];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'patients'), orderBy('name'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: ReminderItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Patient;
        const meds: Medicine[] = data.medicines || [];
        meds.forEach((m, i) => {
          items.push({
            id: `${doc.id}-${i}`,
            patient: data.name,
            medicine: m.name,
            schedule: m.pillSchedule || '',
            pillsPerDay: m.pillsPerDayToBeTaken || '1',
            refillNeeded: m.refillOrNot,
            group: getGroup(m.pillSchedule),
          });
        });
      });
      setReminders(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const total = reminders.length;
  const refill = reminders.filter(r => r.refillNeeded).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reminders</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reminders</Text>
        <Text style={styles.headerDate}>{today}</Text>
      </View>

      <View style={styles.summaryRow}>
        {([
          [String(total),  '#1C1C1E', 'Total'],
          [String(refill), '#FF9500', 'Refill'],
        ] as [string, string, string][]).map(([num, color, label]) => (
          <View key={label} style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color }]}>{num}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {total === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No reminders yet</Text>
          <Text style={styles.emptySubText}>Add patients with medicine schedules to see reminders here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {GROUP_CONFIG.map(({ key, icon, label }) => {
            const group = reminders.filter(r => r.group === key);
            if (group.length === 0) return null;
            return (
              <View key={key}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={icon} size={16} color="#8E8E93" />
                  <Text style={styles.sectionTitle}>{label}</Text>
                </View>
                <View style={styles.cardsList}>
                  {group.map((r) => (
                    <View key={r.id} style={[styles.reminderCard, r.refillNeeded && styles.reminderCardUrgent]}>
                      <View style={styles.reminderLeft}>
                        <View style={[styles.pillIcon, { backgroundColor: r.refillNeeded ? '#FFF3E0' : '#EBF4FF' }]}>
                          <Ionicons name="medical-outline" size={20} color={r.refillNeeded ? '#FF9500' : '#007AFF'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.reminderTopRow}>
                            <Text style={styles.medicineName}>{r.medicine}</Text>
                            {r.refillNeeded && (
                              <View style={styles.lowStockBadge}>
                                <Text style={styles.lowStockText}>REFILL</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.dosageText}>{r.pillsPerDay}x daily · {r.patient}</Text>
                          {r.schedule ? (
                            <View style={styles.timeRow}>
                              <Ionicons name="time-outline" size={13} color="#8E8E93" />
                              <Text style={styles.timeText}>{r.schedule}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  headerDate: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#8E8E93' },
  emptySubText: { fontSize: 14, color: '#C7C7CC', textAlign: 'center', lineHeight: 20 },
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
});
