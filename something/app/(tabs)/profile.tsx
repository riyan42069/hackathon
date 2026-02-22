import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function SettingRow({ icon, label, value, danger = false, onPress }: { icon: any; label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={onPress}>
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loadingPref, setLoadingPref] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setNotificationsEnabled(userDoc.data().notificationsEnabled);
          }
        } catch (error) {
          console.error(error);
        }
      }
      setLoadingPref(false);
    });
    return () => unsub();
  }, []);
  //update the database when the toggle is switched, and also update local state to reflect the change immediately in the UI
  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { notificationsEnabled: value }, { merge: true });
      } catch (error) {
        console.error(error);
      }
    }
  };

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut(auth);
          router.replace('/login');
        }
      },
    ]);
  }

  const email = user?.email || '';
  const avatarLetter = email.charAt(0).toUpperCase() || '?';
  const shortId = user?.uid ? user.uid.slice(0, 8).toUpperCase() : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{email}</Text>
          <Text style={styles.userId}>ID: {shortId}</Text>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT INFORMATION</Text>
        <View style={styles.card}>
          <SettingRow icon="mail-outline" label="Email" value={email} />
          <View style={styles.divider} />
          <SettingRow icon="finger-print-outline" label="User ID" value={shortId} />
        </View>

        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <Ionicons name="notifications-outline" size={18} color="#007AFF" />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              thumbColor="#fff"
              disabled={loadingPref}
            />
          </View>
          <View style={styles.divider} />
          <SettingRow icon="lock-closed-outline" label="Change Password" />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingRow icon="log-out-outline" label="Sign Out" danger onPress={handleSignOut} />
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
  userName: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
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