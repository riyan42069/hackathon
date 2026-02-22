import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import 'react-native-reanimated';

export default function RootLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  return (
    <>
      {/* Stack must always be mounted so the navigation context exists */}
      <Stack>
        <Stack.Screen name="index"           options={{ headerShown: false }} />
        <Stack.Screen name="login"           options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"          options={{ headerShown: false }} />
        <Stack.Screen name="patient-profile" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>

      {/* Overlay hides the initial screen flash while auth is being checked */}
      {checking && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
