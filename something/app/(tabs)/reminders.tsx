import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToPatients } from '../../services/patients';
import { auth } from '../../services/firebase'; 
import { scheduleMedicationReminder, cancelAllNotifications } from '../../services/notifications';

// --- Types & Interfaces ---
type ReminderStatus = 'upcoming' | 'done' | 'missed';

interface Medicine {
  name: string;
  totalPillsPrescribed: string;
  pillsLeft?: number;
  pillsPerDayToBeTaken: string;
  daysPerWeekToTakeThePrescription: string;
  pillSchedule: string;
  refillOrNot: boolean;
  status?: ReminderStatus;
}

interface Patient {
  id: string;
  name: string;
  medicines?: Medicine[];
}

interface UnifiedReminder {
  id: string;
  patient: string;
  medicine: string;
  dosage: string;
  time: string;
  status: ReminderStatus;
  urgent: boolean;
  group: GroupType; 
}

// --- Helper Functions ---
type GroupType = 'Action Needed' | 'Morning' | 'Afternoon' | 'Evening' | 'Other';

function getGroup(schedule: string, refillNeeded: boolean): GroupType {
  if (refillNeeded) return 'Action Needed';
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

const GROUP_CONFIG: { key: GroupType; icon: any; label: string }[] = [
  { key: 'Action Needed', icon: 'alert-circle-outline', label: 'Action Needed: Refill' },
  { key: 'Morning',   icon: 'sunny-outline',        label: 'Morning' },
  { key: 'Afternoon', icon: 'partly-sunny-outline', label: 'Afternoon' },
  { key: 'Evening',   icon: 'moon-outline',         label: 'Evening' },
  { key: 'Other',     icon: 'time-outline',         label: 'Other' },
];

function statusStyle(status: ReminderStatus) {
  switch (status) {
    case 'done':     return { bg: '#E8F5E9', text: '#2E7D32', label: 'Done' };
    case 'missed':   return { bg: '#FFEBEE', text: '#C62828', label: 'Missed' };
    case 'upcoming': return { bg: '#EBF4FF', text: '#007AFF', label: 'Upcoming' };
  }
}

function parseTimeToToday(timeStr: string): Date {
  if (!timeStr) return new Date();
  const cleanStr = timeStr.replace(/\s+/g, '').toUpperCase();
  const match = cleanStr.match(/(\d+):(\d+)(AM|PM)?/);
  if (!match) return new Date();

  let hrs = parseInt(match[1], 10) || 0;
  const mins = parseInt(match[2], 10) || 0;
  const modifier = match[3];
  
  if (modifier === 'PM' && hrs < 12) hrs += 12;
  if (modifier === 'AM' && hrs === 12) hrs = 0;

  const date = new Date();
  date.setHours(hrs, mins, 0, 0);
  return date;
}

// --- Main Component ---
export default function RemindersScreen() {
  const [reminders, setReminders] = useState<UnifiedReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPatients((patientsData: any[]) => {
      const now = new Date();
      const items: UnifiedReminder[] = [];

      patientsData.forEach((p: Patient) => {
        const meds: Medicine[] = p.medicines || [];
        meds.forEach((m, index) => {
          let currentStatus: ReminderStatus = m.status || 'upcoming';
          if (currentStatus !== 'done' && m.pillSchedule) {
            const reminderTime = parseTimeToToday(m.pillSchedule);
            if (now > reminderTime) currentStatus = 'missed';
          }

          const totalPills = parseInt(m.totalPillsPrescribed, 10) || 0;
          const pillsLeft = m.pillsLeft ?? totalPills;
          const needsRefill = m.refillOrNot === true || (totalPills > 0 && pillsLeft <= totalPills * 0.2);

          items.push({
            id: `${p.id}-med-${index}`,
            patient: p.name || 'Unknown Patient',
            medicine: m.name || 'Unknown Med',
            dosage: `${m.pillsPerDayToBeTaken || 1}x daily · ${pillsLeft}/${totalPills} left`,
            time: m.pillSchedule || '',
            status: currentStatus,
            urgent: needsRefill,
            group: getGroup(m.pillSchedule || '', needsRefill),
          });
        });
      });
      setReminders(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSyncAlarms = async () => {
    if (reminders.length === 0) {
      Alert.alert("No Reminders", "Add a patient first.");
      return;
    }
    // Clear all existing scheduled notifications, then re-schedule
    await cancelAllNotifications();
    let scheduled = 0;
    for (const r of reminders) {
      if (!r.time) continue;
      // A reminder can have multiple times: "8:00 AM, 8:00 PM"
      const times = r.time.split(',').map(t => t.trim()).filter(Boolean);
      for (const t of times) {
        const id = await scheduleMedicationReminder(r.patient, r.medicine, t);
        if (id) scheduled++;
      }
    }
    Alert.alert("Sync Successful", `${scheduled} notification${scheduled !== 1 ? 's' : ''} scheduled. You'll get reminders even when the app is closed.`);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const total = reminders.length;
  const upcoming = reminders.filter(r => r.status === 'upcoming').length;
  const missed = reminders.filter(r => r.status === 'missed').length;
  const refill = reminders.filter(r => r.urgent).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Reminders</Text>
            <Text style={styles.headerDate}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.syncButton} onPress={handleSyncAlarms}>
            <Ionicons name="sync-outline" size={18} color="#007AFF" />
            <Text style={styles.syncText}>Sync Alarms</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryRow}>
        {[
          [total, '#1C1C1E', 'Total'],
          [upcoming, '#007AFF', 'Upcoming'],
          [missed, '#FF3B30', 'Missed'],
          [refill, '#FF9500', 'Refill'],
        ].map(([num, color, label]) => (
          <View key={label as string} style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: color as string }]}>{num as number}</Text>
            <Text style={styles.summaryLabel}>{label as string}</Text>
          </View>
        ))}
      </View>

      {total === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No reminders yet</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {GROUP_CONFIG.map(({ key, icon, label }) => {
            const groupReminders = reminders.filter(r => r.group === key);
            if (groupReminders.length === 0) return null;

            return (
              <View key={key}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={icon} size={16} color="#8E8E93" />
                  <Text style={styles.sectionTitle}>{label}</Text>
                </View>
                <View style={styles.cardsList}>
                  {groupReminders.map((r) => {
                    const s = statusStyle(r.status);
                    return (
                      <TouchableOpacity 
                        key={r.id} 
                        activeOpacity={0.7}
                        style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}
                        onPress={() => Alert.alert("Reminder", `${r.medicine} for ${r.patient}`)}
                      >
                        <View style={styles.reminderLeft}>
                          <View style={[styles.pillIcon, { backgroundColor: s.bg }]}>
                            <Ionicons name="medical-outline" size={20} color={s.text} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.reminderTopRow}>
                              <Text style={styles.medicineName}>{r.medicine}</Text>
                              {r.urgent && (
                                <View style={styles.lowStockBadge}><Text style={styles.lowStockText}>REFILL</Text></View>
                              )}
                            </View>
                            <Text style={styles.dosageText}>{r.dosage} · {r.patient}</Text>
                            {r.time && (
                              <View style={styles.timeRow}>
                                <Ionicons name="time-outline" size={13} color="#8E8E93" />
                                <Text style={styles.timeText}>{r.time}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                          <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7' 
  },
  header: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7' 
  },
  
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%' 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1C1C1E', 
    letterSpacing: -0.5 
  },
  headerDate: { 
    fontSize: 14, 
    color: '#8E8E93', 
    fontWeight: '500', 
    marginTop: 2 
  },
  syncButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#007AFF', // Solid blue so it's easier to see
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    gap: 6,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncText: { 
    color: '#fff', // White text on blue button
    fontWeight: '700', 
    fontSize: 13 
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10, marginTop: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#8E8E93' },
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