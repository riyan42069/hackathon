import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const USER = {
  name: 'Dr. Sarah Smith',
  id: 'MED-00421',
  role: 'Medical Officer',
  email: 'sarah.smith@hospital.com',
  phone: '+1 (555) 012-3456',
  department: 'Internal Medicine',
  hospital: 'City General Hospital',
};

function SettingRow({ icon, label, value, danger = false }: { icon: any; label: string; value?: string; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
      <View style={[styles.settingIconBox, danger && styles.settingIconBoxDanger]}>
        <Ionicons name={icon} size={18} color={danger ? '#FF3B30' : '#007AFF'} />
      </View>
      <View style={styles.settingTextGroup}>
        <Text style={[styles.settingLabel, danger && { color: '#FF3B30' }]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{USER.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{USER.role}</Text>
          </View>
          <Text style={styles.userId}>ID: {USER.id}</Text>
        </View>

        <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
        <View style={styles.card}>
          <SettingRow icon="mail-outline" label="Email" value={USER.email} />
          <View style={styles.divider} />
          <SettingRow icon="call-outline" label="Phone" value={USER.phone} />
          <View style={styles.divider} />
          <SettingRow icon="business-outline" label="Hospital" value={USER.hospital} />
          <View style={styles.divider} />
          <SettingRow icon="medkit-outline" label="Department" value={USER.department} />
        </View>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.card}>
          <SettingRow icon="notifications-outline" label="Notifications" />
          <View style={styles.divider} />
          <SettingRow icon="lock-closed-outline" label="Change Password" />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark-outline" label="Privacy & Security" />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingRow icon="log-out-outline" label="Sign Out" danger />
        </View>

        <Text style={styles.version}>MediTrack v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 28, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 },
  avatarText: { fontSize: 38, fontWeight: '800', color: '#fff' },
  avatarEdit: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0055D4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F2F2F7' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  roleBadge: { backgroundColor: '#EBF4FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  userId: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 20, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  settingIconBoxDanger: { backgroundColor: '#FFEBEE' },
  settingTextGroup: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  settingValue: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 62 },
  version: { textAlign: 'center', fontSize: 13, color: '#C7C7CC', fontWeight: '500', marginBottom: 20 },
});
