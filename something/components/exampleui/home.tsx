import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- Mock Data ---
const REMINDERS = [
  { id: '1', patient: 'John Doe', medicine: 'Lisinopril', time: '8:00 AM', urgent: false },
  { id: '2', patient: 'Jane Smith', medicine: 'Metformin', time: '9:30 AM', urgent: true },
  { id: '3', patient: 'Bob Lee', medicine: 'Vitamin D3', time: '12:00 PM', urgent: false },
];

const PATIENTS = [
  { id: '1', name: 'John Doe', patientId: 'P-8832', age: 54, gender: 'Male', status: 'stable', medsCount: 3, pillsAlert: false },
  { id: '2', name: 'Jane Smith', patientId: 'P-7721', age: 67, gender: 'Female', status: 'attention', medsCount: 5, pillsAlert: true },
  { id: '3', name: 'Bob Lee', patientId: 'P-9012', age: 45, gender: 'Male', status: 'stable', medsCount: 2, pillsAlert: false },
  { id: '4', name: 'Maria Garcia', patientId: 'P-8102', age: 72, gender: 'Female', status: 'attention', medsCount: 4, pillsAlert: true },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good Morning 👋</Text>
          <Text style={styles.headerName}>Dr. Sarah Smith</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color="#1C1C1E" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Reminder Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.remindersRow}>
          {REMINDERS.map((r) => (
            <View key={r.id} style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}>
              <View style={[styles.reminderIcon, r.urgent && styles.reminderIconUrgent]}>
                <Ionicons name="alarm-outline" size={18} color={r.urgent ? '#FF9500' : '#007AFF'} />
              </View>
              <Text style={styles.reminderTime}>{r.time}</Text>
              <Text style={styles.reminderMed} numberOfLines={1}>{r.medicine}</Text>
              <Text style={styles.reminderPatient} numberOfLines={1}>{r.patient}</Text>
              {r.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>LOW STOCK</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="#C7C7CC"
            style={styles.searchInput}
          />
        </View>

        {/* Patients List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patients</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{PATIENTS.length} Total</Text>
          </View>
        </View>

        <View style={styles.patientsList}>
          {PATIENTS.map((p) => (
            <TouchableOpacity key={p.id} style={styles.patientCard} activeOpacity={0.75}>
              <View style={styles.patientLeft}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>ID #{p.patientId} • {p.age} yrs • {p.gender}</Text>
                </View>
              </View>
              <View style={styles.patientRight}>
                <View style={[styles.statusBadge, p.status === 'stable' ? styles.statusStable : styles.statusAttention]}>
                  <Text style={[styles.statusText, p.status === 'stable' ? styles.statusTextStable : styles.statusTextAttention]}>
                    {p.status === 'stable' ? 'Stable' : 'Attention'}
                  </Text>
                </View>
                {p.pillsAlert && (
                  <View style={styles.pillAlert}>
                    <Ionicons name="warning-outline" size={12} color="#FF9500" />
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerGreeting: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0055D4',
    letterSpacing: -0.3,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  remindersRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  reminderCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderCardUrgent: {
    borderWidth: 1.5,
    borderColor: '#FF9500',
  },
  reminderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  reminderIconUrgent: {
    backgroundColor: '#FFF3E0',
  },
  reminderTime: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  reminderMed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reminderPatient: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  urgentBadge: {
    marginTop: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9500',
    letterSpacing: 0.5,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  countBadge: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  patientsList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  patientMeta: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  patientRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusStable: {
    backgroundColor: '#E8F5E9',
  },
  statusAttention: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusTextStable: {
    color: '#2E7D32',
  },
  statusTextAttention: {
    color: '#F57F17',
  },
  pillAlert: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
});
