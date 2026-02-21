import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              <Ionicons name="medical" size={44} color="#fff" />
            </View>
            <Text style={styles.appName}>MediTrack</Text>
            <Text style={styles.appSubtitle}>Patient Medication Management</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="doctor@hospital.com" placeholderTextColor="#C7C7CC" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#C7C7CC" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInButton} activeOpacity={0.85} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hipaaRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#8E8E93" />
            <Text style={styles.hipaaText}>Secure HIPAA-compliant environment</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 24 },
  logoSection: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 30, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 4 },
  appSubtitle: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  signInButton: { backgroundColor: '#007AFF', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  signInText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hipaaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  hipaaText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
});
