import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { registerForPushNotificationsAsync } from '../services/notifications';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

export default function RootLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Request notification permissions on launch
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

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
